import crypto from "crypto";
import { JobLockModel } from "../../models/JobLock.model";

const processOwnerId = `${process.pid}-${crypto.randomUUID()}`;

export class JobLockService {
  static async withLock<T>(
    lockName: string,
    ttlSeconds: number,
    handler: () => Promise<T>
  ): Promise<{ acquired: boolean; result?: T }> {
    const acquired = await this.acquire(lockName, ttlSeconds);

    if (!acquired) {
      return { acquired: false };
    }

    try {
      const result = await handler();
      return { acquired: true, result };
    } finally {
      await this.release(lockName).catch((error) => {
        console.error(`Failed to release job lock ${lockName}:`, error);
      });
    }
  }

  static async acquire(lockName: string, ttlSeconds: number): Promise<boolean> {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlSeconds * 1000);

    const result = await JobLockModel.findOneAndUpdate(
      {
        name: lockName,
        $or: [
          { lockedUntil: { $lte: now } },
          { ownerId: processOwnerId }
        ]
      },
      {
        $set: {
          name: lockName,
          ownerId: processOwnerId,
          lockedUntil,
          lastAcquiredAt: now
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return result.ownerId === processOwnerId;
  }

  static async release(lockName: string): Promise<void> {
    await JobLockModel.updateOne(
      { name: lockName, ownerId: processOwnerId },
      {
        $set: {
          lockedUntil: new Date(0)
        }
      }
    );
  }
}
