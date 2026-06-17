import { Schema, model, type InferSchemaType } from "mongoose";

const jobLockSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },

    ownerId: {
      type: String,
      required: true,
      trim: true
    },

    lockedUntil: {
      type: Date,
      required: true,
      index: true
    },

    lastAcquiredAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type JobLock = InferSchemaType<typeof jobLockSchema>;

export const JobLockModel = model("JobLock", jobLockSchema);
