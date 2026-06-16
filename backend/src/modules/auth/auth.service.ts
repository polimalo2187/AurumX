import { UserModel, USER_STATUSES, type User } from "../../models/User.model";
import { unauthorized, forbidden } from "../../utils/errors";
import { JwtService } from "./jwt.service";

function sanitizeUser(user: User) {
  return {
    id: user._id.toString(),
    telegramId: user.telegramId,
    telegramUsername: user.telegramUsername,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    referralCode: user.referralCode,
    validReferralCount: user.validReferralCount,
    activePowerPercent: user.activePowerPercent,
    role: user.role,
    status: user.status
  };
}

export class AuthService {
  static async issueTokenForVerifiedUser(userId: string) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw unauthorized("User not found", "USER_NOT_FOUND");
    }

    if (!user.phoneVerified) {
      throw forbidden("Telegram phone verification is required", "PHONE_NOT_VERIFIED");
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw forbidden("User is blocked", "USER_BLOCKED");
    }

    const token = JwtService.sign({
      sub: user._id.toString(),
      role: user.role,
      telegramId: user.telegramId
    });

    return {
      token,
      user: sanitizeUser(user)
    };
  }
}
