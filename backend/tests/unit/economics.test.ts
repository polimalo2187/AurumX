import assert from "node:assert/strict";
import test from "node:test";
import { MACHINE_TYPES } from "../../src/config/constants";
import { calculateMachineReward, calculatePlanEconomics, getPowerPercentForMachine } from "../../src/utils/economics";

test("calculatePlanEconomics returns correct values for paid machines", () => {
  const economics = calculatePlanEconomics({
    type: MACHINE_TYPES.PAID,
    priceUSDT: 100,
    virtualPrincipalUSDT: 0,
    payoutMultiplier: 2,
    durationCycles: 20
  });

  assert.deepEqual(economics, {
    principalAmount: 100,
    maxPayoutAmount: 200,
    baseCycleRewardAmount: 10
  });
});

test("calculatePlanEconomics uses virtual principal for free and reward machines", () => {
  const freeEconomics = calculatePlanEconomics({
    type: MACHINE_TYPES.FREE,
    priceUSDT: 0,
    virtualPrincipalUSDT: 1,
    payoutMultiplier: 2,
    durationCycles: 20
  });

  const rewardEconomics = calculatePlanEconomics({
    type: MACHINE_TYPES.REWARD,
    priceUSDT: 0,
    virtualPrincipalUSDT: 7,
    payoutMultiplier: 2,
    durationCycles: 20
  });

  assert.equal(freeEconomics.maxPayoutAmount, 2);
  assert.equal(freeEconomics.baseCycleRewardAmount, 0.1);
  assert.equal(rewardEconomics.maxPayoutAmount, 14);
  assert.equal(rewardEconomics.baseCycleRewardAmount, 0.7);
});

test("power applies only to paid machines and is capped at 30%", () => {
  assert.equal(getPowerPercentForMachine(MACHINE_TYPES.PAID, 10), 10);
  assert.equal(getPowerPercentForMachine(MACHINE_TYPES.PAID, 80), 30);
  assert.equal(getPowerPercentForMachine(MACHINE_TYPES.FREE, 30), 0);
  assert.equal(getPowerPercentForMachine(MACHINE_TYPES.REWARD, 30), 0);
});

test("calculateMachineReward accelerates paid machines without exceeding payout max", () => {
  const reward = calculateMachineReward(
    {
      machineType: MACHINE_TYPES.PAID,
      baseCycleRewardAmount: 10,
      maxPayoutAmount: 200,
      paidAmount: 195
    },
    30
  );

  assert.equal(reward.powerPercentApplied, 30);
  assert.equal(reward.effectiveRewardAmount, 13);
  assert.equal(reward.remainingAmount, 5);
  assert.equal(reward.rewardToPay, 5);
});

test("free and reward machines ignore power", () => {
  const freeReward = calculateMachineReward(
    {
      machineType: MACHINE_TYPES.FREE,
      baseCycleRewardAmount: 0.1,
      maxPayoutAmount: 2,
      paidAmount: 0
    },
    30
  );

  const auroraReward = calculateMachineReward(
    {
      machineType: MACHINE_TYPES.REWARD,
      baseCycleRewardAmount: 0.7,
      maxPayoutAmount: 14,
      paidAmount: 0
    },
    30
  );

  assert.equal(freeReward.powerPercentApplied, 0);
  assert.equal(freeReward.rewardToPay, 0.1);
  assert.equal(auroraReward.powerPercentApplied, 0);
  assert.equal(auroraReward.rewardToPay, 0.7);
});
