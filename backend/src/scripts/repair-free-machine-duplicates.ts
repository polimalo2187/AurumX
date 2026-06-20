import { connectDatabase, disconnectDatabase } from "../config/db";
import {
  FreeMachineClaimModel,
  FREE_MACHINE_CLAIM_STATUSES
} from "../models/FreeMachineClaim.model";
import { UserModel } from "../models/User.model";
import {
  UserMachineModel,
  USER_MACHINE_SOURCE_TYPES,
  USER_MACHINE_STATUSES
} from "../models/UserMachine.model";

async function repairFreeMachineDuplicates(): Promise<void> {
  await connectDatabase();

  const freeMachines = await UserMachineModel.find({
    sourceType: USER_MACHINE_SOURCE_TYPES.FREE_CLAIM,
    status: { $ne: USER_MACHINE_STATUSES.CANCELLED }
  }).sort({ userId: 1, activatedAt: 1, createdAt: 1 });

  const byUser = new Map<string, typeof freeMachines>();

  for (const machine of freeMachines) {
    const key = machine.userId.toString();
    const group = byUser.get(key) ?? [];
    group.push(machine);
    byUser.set(key, group as typeof freeMachines);
  }

  let usersScanned = 0;
  let duplicatesCancelled = 0;
  let claimsSynced = 0;

  for (const [userId, machines] of byUser.entries()) {
    usersScanned += 1;

    const [canonicalMachine, ...duplicates] = machines;

    if (!canonicalMachine) continue;

    if (duplicates.length > 0) {
      const duplicateIds = duplicates.map((machine) => machine._id);

      const result = await UserMachineModel.updateMany(
        { _id: { $in: duplicateIds } },
        {
          $set: {
            status: USER_MACHINE_STATUSES.CANCELLED,
            completedAt: new Date(),
            nextRewardAt: null
          }
        }
      );

      duplicatesCancelled += result.modifiedCount;
    }

    const user = await UserModel.findById(userId).select("telegramId phoneNumber");

    if (!user) {
      console.warn(`User ${userId} not found while repairing free machine claim`);
      continue;
    }

    await FreeMachineClaimModel.updateOne(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          claimedAt:
            canonicalMachine.activatedAt ??
            (canonicalMachine as unknown as { createdAt?: Date }).createdAt ??
            new Date()
        },
        $set: {
          telegramId: user.telegramId,
          phoneNumber: user.phoneNumber,
          userMachineId: canonicalMachine._id,
          status: FREE_MACHINE_CLAIM_STATUSES.CLAIMED
        }
      },
      { upsert: true }
    );

    claimsSynced += 1;
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        usersScanned,
        duplicatesCancelled,
        claimsSynced
      },
      null,
      2
    )
  );
}

repairFreeMachineDuplicates()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Free machine duplicate repair failed:", error);
    await disconnectDatabase();
    process.exit(1);
  });
