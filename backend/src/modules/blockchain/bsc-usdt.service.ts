import { Interface, JsonRpcProvider, formatUnits, getAddress } from "ethers";
import { env } from "../../config/env";
import { SYSTEM_RULES } from "../../config/constants";
import { normalizeBscAddress } from "../../utils/bsc-address";
import { normalizeTxHash } from "../../utils/tx-hash";
import { roundUSDT } from "../../utils/money";
import type {
  BlockchainDepositVerifier,
  DepositVerificationInput,
  DepositVerificationResult
} from "./blockchain.service";

const ERC20_TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const transferInterface = new Interface(ERC20_TRANSFER_ABI);

export class BscUsdtService implements BlockchainDepositVerifier {
  private readonly provider: JsonRpcProvider;
  private readonly usdtContractAddress: string;
  private readonly minConfirmations: number;

  constructor() {
    if (!env.BSC_RPC_URL) {
      throw new Error("BSC_RPC_URL is required for blockchain verification");
    }

    if (!env.BSC_USDT_CONTRACT_ADDRESS) {
      throw new Error("BSC_USDT_CONTRACT_ADDRESS is required for blockchain verification");
    }

    this.provider = new JsonRpcProvider(env.BSC_RPC_URL, env.BSC_CHAIN_ID);
    this.usdtContractAddress = normalizeBscAddress(env.BSC_USDT_CONTRACT_ADDRESS);
    this.minConfirmations = env.MIN_BSC_CONFIRMATIONS || SYSTEM_RULES.MIN_BSC_CONFIRMATIONS;
  }

  async verifyBep20UsdtDeposit(
    input: DepositVerificationInput
  ): Promise<DepositVerificationResult> {
    const txHash = normalizeTxHash(input.txHash);
    const expectedReceiver = normalizeBscAddress(input.expectedReceiver);

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return { valid: false, status: "TX_NOT_FOUND", txHash };
      }

      if (receipt.status !== 1) {
        return {
          valid: false,
          status: "FAILED",
          txHash,
          blockNumber: Number(receipt.blockNumber),
          reason: "Transaction failed on-chain"
        };
      }

      const latestBlock = await this.provider.getBlockNumber();
      const blockNumber = Number(receipt.blockNumber);
      const confirmations = Math.max(latestBlock - blockNumber + 1, 0);

      const transfers = receipt.logs
        .map((log) => {
          try {
            if (normalizeBscAddress(log.address) !== this.usdtContractAddress) {
              return null;
            }

            const parsed = transferInterface.parseLog({
              topics: [...log.topics],
              data: log.data
            });

            if (!parsed || parsed.name !== "Transfer") {
              return null;
            }

            const from = getAddress(parsed.args[0] as string).toLowerCase();
            const to = getAddress(parsed.args[1] as string).toLowerCase();
            const amountUSDT = roundUSDT(Number(formatUnits(parsed.args[2] as bigint, 18)));

            return {
              fromAddress: from,
              toAddress: to,
              amountUSDT,
              tokenContract: normalizeBscAddress(log.address)
            };
          } catch {
            return null;
          }
        })
        .filter((transfer): transfer is NonNullable<typeof transfer> => Boolean(transfer));

      if (transfers.length === 0) {
        return {
          valid: false,
          status: "WRONG_TOKEN",
          txHash,
          confirmations,
          blockNumber,
          reason: "No official USDT BEP20 transfer found"
        };
      }

      const matchingReceiver = transfers.find((transfer) => transfer.toAddress === expectedReceiver);

      if (!matchingReceiver) {
        return {
          valid: false,
          status: "WRONG_RECEIVER",
          txHash,
          confirmations,
          blockNumber,
          tokenContract: this.usdtContractAddress,
          reason: "USDT transfer receiver does not match platform deposit address"
        };
      }

      if (matchingReceiver.amountUSDT < input.expectedAmountUSDT) {
        return {
          valid: false,
          status: "INSUFFICIENT_AMOUNT",
          txHash,
          confirmations,
          blockNumber,
          ...matchingReceiver,
          reason: "USDT amount is lower than expected"
        };
      }

      if (confirmations < this.minConfirmations) {
        return {
          valid: false,
          status: "PENDING_CONFIRMATIONS",
          txHash,
          confirmations,
          blockNumber,
          ...matchingReceiver,
          reason: "Waiting for enough BSC confirmations"
        };
      }

      return {
        valid: true,
        status: "CONFIRMED",
        txHash,
        confirmations,
        blockNumber,
        ...matchingReceiver
      };
    } catch (error) {
      return {
        valid: false,
        status: "UNKNOWN_ERROR",
        txHash,
        reason: error instanceof Error ? error.message : "Unknown blockchain verification error"
      };
    }
  }
}
