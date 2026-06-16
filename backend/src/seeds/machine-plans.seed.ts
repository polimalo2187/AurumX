import { connectDatabase, disconnectDatabase } from "../config/db";
import {
  MACHINE_PLAN_SLUGS,
  MACHINE_TYPES,
  SYSTEM_RULES
} from "../config/constants";
import { MachinePlanModel } from "../models/MachinePlan.model";

type MachineSeed = {
  slug: string;
  name: string;
  type: "FREE" | "PAID" | "REWARD";
  priceUSDT: number;
  virtualPrincipalUSDT: number;
  durationCycles: number;
  cycleHours: number;
  payoutMultiplier: number;
  powerEnabled: boolean;
  isActive: boolean;
  sortOrder: number;
};

const machinePlans: MachineSeed[] = [
  {
    slug: MACHINE_PLAN_SLUGS.PICO_INICIAL,
    name: "Pico Inicial",
    type: MACHINE_TYPES.FREE,
    priceUSDT: 0,
    virtualPrincipalUSDT: SYSTEM_RULES.FREE_MACHINE_VIRTUAL_PRINCIPAL_USDT,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: false,
    isActive: true,
    sortOrder: 1
  },
  {
    slug: MACHINE_PLAN_SLUGS.EXCAVADORA,
    name: "Excavadora",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 7,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 2
  },
  {
    slug: MACHINE_PLAN_SLUGS.PERFORADORA,
    name: "Perforadora",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 24,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 3
  },
  {
    slug: MACHINE_PLAN_SLUGS.TRITURADORA,
    name: "Trituradora",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 50,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 4
  },
  {
    slug: MACHINE_PLAN_SLUGS.PLANTA_ELITE,
    name: "Planta Élite",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 100,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 5
  },
  {
    slug: MACHINE_PLAN_SLUGS.DRAGALINA,
    name: "Dragalina",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 500,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 6
  },
  {
    slug: MACHINE_PLAN_SLUGS.COLOSO,
    name: "Coloso",
    type: MACHINE_TYPES.PAID,
    priceUSDT: 1000,
    virtualPrincipalUSDT: 0,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: true,
    isActive: true,
    sortOrder: 7
  },
  {
    slug: MACHINE_PLAN_SLUGS.AURORA,
    name: "Aurora",
    type: MACHINE_TYPES.REWARD,
    priceUSDT: 0,
    virtualPrincipalUSDT: SYSTEM_RULES.REWARD_MACHINE_VIRTUAL_PRINCIPAL_USDT,
    durationCycles: SYSTEM_RULES.MACHINE_DURATION_CYCLES,
    cycleHours: SYSTEM_RULES.MACHINE_CYCLE_HOURS,
    payoutMultiplier: SYSTEM_RULES.PAYOUT_MULTIPLIER,
    powerEnabled: false,
    isActive: true,
    sortOrder: 8
  }
];

async function seedMachinePlans(): Promise<void> {
  await connectDatabase();

  for (const plan of machinePlans) {
    await MachinePlanModel.updateOne(
      { slug: plan.slug },
      {
        $set: {
          name: plan.name,
          type: plan.type,
          priceUSDT: plan.priceUSDT,
          virtualPrincipalUSDT: plan.virtualPrincipalUSDT,
          durationCycles: plan.durationCycles,
          cycleHours: plan.cycleHours,
          payoutMultiplier: plan.payoutMultiplier,
          powerEnabled: plan.powerEnabled,
          isActive: plan.isActive,
          sortOrder: plan.sortOrder
        }
      },
      { upsert: true }
    );

    const principal =
      plan.type === MACHINE_TYPES.PAID
        ? plan.priceUSDT
        : plan.virtualPrincipalUSDT;

    const maxPayout = principal * plan.payoutMultiplier;
    const baseReward = maxPayout / plan.durationCycles;

    console.log(
      `Seeded ${plan.name}: principal=${principal}, maxPayout=${maxPayout}, baseReward=${baseReward}`
    );
  }

  await disconnectDatabase();
}

seedMachinePlans()
  .then(() => {
    console.log("Machine plans seed completed");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Machine plans seed failed:", error);
    await disconnectDatabase();
    process.exit(1);
  });
