import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { WalletController } from "./wallet.controller";

export const walletRouter = Router();

walletRouter.use(authMiddleware);
walletRouter.get("/me", WalletController.getMyWallet);
walletRouter.get("/transactions", WalletController.getMyTransactions);
