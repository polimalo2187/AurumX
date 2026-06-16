import { Schema, model, type InferSchemaType, Types } from "mongoose";

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    availableUSDT: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },

    lockedUSDT: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type Wallet = InferSchemaType<typeof walletSchema> & { _id: Types.ObjectId };

export const WalletModel = model("Wallet", walletSchema);
