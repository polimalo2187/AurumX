import { Schema, model, type InferSchemaType } from "mongoose";
import { MACHINE_TYPES } from "../config/constants";

const machinePlanSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: Object.values(MACHINE_TYPES),
      required: true,
      index: true
    },

    priceUSDT: {
      type: Number,
      required: true,
      min: 0
    },

    virtualPrincipalUSDT: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    durationCycles: {
      type: Number,
      required: true,
      min: 1
    },

    cycleHours: {
      type: Number,
      required: true,
      min: 1
    },

    payoutMultiplier: {
      type: Number,
      required: true,
      min: 1
    },

    powerEnabled: {
      type: Boolean,
      required: true,
      default: false
    },

    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true
    },

    sortOrder: {
      type: Number,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

machinePlanSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

machinePlanSchema.virtual("principalUSDT").get(function () {
  return this.type === MACHINE_TYPES.PAID
    ? this.priceUSDT
    : this.virtualPrincipalUSDT;
});

machinePlanSchema.virtual("maxPayoutAmount").get(function () {
  const principal =
    this.type === MACHINE_TYPES.PAID
      ? this.priceUSDT
      : this.virtualPrincipalUSDT;

  return principal * this.payoutMultiplier;
});

machinePlanSchema.virtual("baseCycleRewardAmount").get(function () {
  const principal =
    this.type === MACHINE_TYPES.PAID
      ? this.priceUSDT
      : this.virtualPrincipalUSDT;

  return (principal * this.payoutMultiplier) / this.durationCycles;
});

machinePlanSchema.set("toJSON", { virtuals: true });
machinePlanSchema.set("toObject", { virtuals: true });

export type MachinePlan = InferSchemaType<typeof machinePlanSchema>;

export const MachinePlanModel = model("MachinePlan", machinePlanSchema);
