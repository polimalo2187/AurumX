import assert from "node:assert/strict";
import test from "node:test";
import { calculateActivePowerPercent, calculateReferralStats } from "../../src/utils/referral-stats";

test("active power grows by 2.5% per valid referral and caps at 30%", () => {
  assert.equal(calculateActivePowerPercent(0), 0);
  assert.equal(calculateActivePowerPercent(1), 2.5);
  assert.equal(calculateActivePowerPercent(12), 30);
  assert.equal(calculateActivePowerPercent(20), 30);
});

test("referral stats count extra referrals only after 12 valid referrals", () => {
  const stats = calculateReferralStats({ validReferralCount: 22, rewardReferralUsedCount: 0 });

  assert.equal(stats.activePowerPercent, 30);
  assert.equal(stats.referralsNeededForMaxPower, 0);
  assert.equal(stats.totalExtraReferrals, 10);
  assert.equal(stats.availableExtraReferrals, 10);
  assert.equal(stats.claimableRewardMachines, 1);
});

test("reward machine claims consume 10 extra referrals", () => {
  const stats = calculateReferralStats({ validReferralCount: 32, rewardReferralUsedCount: 10 });

  assert.equal(stats.totalExtraReferrals, 20);
  assert.equal(stats.usedExtraReferrals, 10);
  assert.equal(stats.availableExtraReferrals, 10);
  assert.equal(stats.claimableRewardMachines, 1);
});

test("stats never go negative", () => {
  const stats = calculateReferralStats({ validReferralCount: 3, rewardReferralUsedCount: 10 });

  assert.equal(stats.activePowerPercent, 7.5);
  assert.equal(stats.referralsNeededForMaxPower, 9);
  assert.equal(stats.totalExtraReferrals, 0);
  assert.equal(stats.availableExtraReferrals, 0);
  assert.equal(stats.claimableRewardMachines, 0);
});
