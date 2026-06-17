import assert from "node:assert/strict";
import test from "node:test";
import { isValidBscAddress, normalizeBscAddress } from "../../src/utils/bsc-address";
import { isValidTxHash, normalizeTxHash } from "../../src/utils/tx-hash";

test("BSC address validator accepts 0x addresses and normalizes to lowercase", () => {
  const address = "0x000000000000000000000000000000000000dEaD";

  assert.equal(isValidBscAddress(address), true);
  assert.equal(normalizeBscAddress(address), address.toLowerCase());
});

test("BSC address validator rejects malformed addresses", () => {
  assert.equal(isValidBscAddress(""), false);
  assert.equal(isValidBscAddress("0x123"), false);
  assert.equal(isValidBscAddress("not-a-wallet"), false);
});

test("tx hash validator accepts 32-byte hashes and normalizes to lowercase", () => {
  const hash = `0x${"A".repeat(64)}`;

  assert.equal(isValidTxHash(hash), true);
  assert.equal(normalizeTxHash(hash), hash.toLowerCase());
});

test("tx hash validator rejects malformed hashes", () => {
  assert.equal(isValidTxHash(""), false);
  assert.equal(isValidTxHash("0xabc"), false);
  assert.equal(isValidTxHash(`0x${"z".repeat(64)}`), false);
});
