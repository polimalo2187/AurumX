import { Schema, model, type InferSchemaType, Types } from "mongoose";

export const FREE_MACHINE_CLAIM_STATUSES = {
  CLAIMED: "CLAIMED",
  COMPLETED: "COMPLETED",
  BLOCKED: "BLOCKED"
} as const;

const freeMachineClaimSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    telegramId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    userMachineId: {
      type: Schema.Types.ObjectId,
      ref: "UserMachine",
      required: true,
      unique: true,
      index: true
    },

    status: {
      type: String,
      enum: Object.values(FREE_MACHINE_CLAIM_STATUSES),
      required: true,
      default: FREE_MACHINE_CLAIM_STATUSES.CLAIMED,
      index: true
    },

    claimedAt: {
      type: Date,
      required: true
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type FreeMachineClaim = InferSchemaType<typeof freeMachineClaimSchema> & {
  _id: Types.ObjectId;
};

export const FreeMachineClaimModel = model("FreeMachineClaim", freeMachineClaimSchema);
