import { randomBytes } from "crypto";
import type { ClientSession, Types } from "mongoose";
import { UserModel, USER_ROLES, type User } from "../../models/User.model";
import { WalletService } from "../wallet/wallet.service";
import { conflict, notFound, badRequest } from "../../utils/errors";
import { normalizeTelegramPhone } from "../../utils/phone";
import { adminTelegramIds } from "../../config/env";

export type TelegramVerifiedUserInput = {
  telegramId: string;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  referralCode?: string;
};

function normalizePhone(phoneNumber: string): string {
  return normalizeTelegramPhone(phoneNumber);
}

export function sanitizeUser(user: User) {
  return {
    id: user._id.toString(),
    telegramId: user.telegramId,
    username: user.username ?? "",
    telegramUsername: user.telegramUsername,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phoneCountryCode: user.phoneCountryCode ?? "",
    phoneNationalNumber: user.phoneNationalNumber ?? "",
    phoneE164: user.phoneE164 ?? user.phoneNumber,
    phoneVerified: user.phoneVerified,
    phoneVerifiedAt: user.phoneVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    referralCode: user.referralCode,
    referredByUserId: user.referredByUserId,
    validReferralCount: user.validReferralCount,
    activePowerPercent: user.activePowerPercent,
    rewardReferralUsedCount: user.rewardReferralUsedCount,
    claimedRewardMachineCount: user.claimedRewardMachineCount,
    riskFlagged: user.riskFlagged,
    riskLevel: user.riskLevel,
    riskScore: user.riskScore,
    riskFlagsCount: user.riskFlagsCount,
    riskLastEvaluatedAt: user.riskLastEvaluatedAt,
    role: user.role,
    status: user.status,
    lastWithdrawalRequestedAt: user.lastWithdrawalRequestedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export class UserService {
  static async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = `AX${randomBytes(4).toString("hex").toUpperCase()}`;
      const exists = await UserModel.exists({ referralCode: code });

      if (!exists) {
        return code;
      }
    }

    throw new Error("Unable to generate referral code");
  }

  static async createOrUpdateTelegramVerifiedUser(
    input: TelegramVerifiedUserInput,
    session?: ClientSession
  ) {
    const telegramId = input.telegramId.trim();
    const phoneNumber = normalizePhone(input.phoneNumber);

    if (!telegramId || !phoneNumber) {
      throw badRequest("Telegram ID and phone number are required", "INVALID_TELEGRAM_USER");
    }

    const phoneOwner = await UserModel.findOne({ phoneNumber }).session(session ?? null);

    if (phoneOwner && phoneOwner.telegramId && phoneOwner.telegramId !== telegramId) {
      throw conflict("Phone number is already linked to another Telegram account", "PHONE_ALREADY_USED");
    }

    let user = await UserModel.findOne({ telegramId }).session(session ?? null);

    if (!user && phoneOwner && !phoneOwner.telegramId) {
      user = phoneOwner;
    }

    if (!user) {
      const referralCode = await UserService.generateUniqueReferralCode();
      let referredByUserId: Types.ObjectId | null = null;

      if (input.referralCode) {
        const sponsor = await UserModel.findOne({
          referralCode: input.referralCode.trim().toUpperCase()
        }).session(session ?? null);

        if (sponsor && sponsor.telegramId !== telegramId) {
          referredByUserId = sponsor._id;
        }
      }

      const role = adminTelegramIds.includes(telegramId) ? USER_ROLES.ADMIN : USER_ROLES.USER;

      const createdUsers = await UserModel.create(
        [
          {
            telegramId,
            telegramUsername: input.telegramUsername ?? "",
            firstName: input.firstName ?? "",
            lastName: input.lastName ?? "",
            phoneNumber,
            phoneE164: phoneNumber,
            phoneVerified: true,
            phoneVerifiedAt: new Date(),
            referralCode,
            referredByUserId,
            role
          }
        ],
        { session }
      );

      const created = createdUsers[0];

      if (!created) {
        throw new Error("Failed to create user");
      }

      user = created;
      await WalletService.createWalletForUser(user._id, session);
      return user;
    }

    user.telegramUsername = input.telegramUsername ?? user.telegramUsername;
    user.firstName = input.firstName ?? user.firstName;
    user.lastName = input.lastName ?? user.lastName;
    user.telegramId = telegramId;
    user.phoneNumber = phoneNumber;
    user.phoneE164 = phoneNumber;
    user.phoneVerified = true;
    user.phoneVerifiedAt = user.phoneVerifiedAt ?? new Date();

    if (!user.referralCode) {
      user.referralCode = await UserService.generateUniqueReferralCode();
    }

    await user.save({ session });
    await WalletService.createWalletForUser(user._id, session);

    return user;
  }

  static async getUserOrFail(userId: Types.ObjectId | string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw notFound("User not found", "USER_NOT_FOUND");
    }

    return user;
  }
}
