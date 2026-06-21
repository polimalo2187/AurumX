import { UserModel, USER_STATUSES, USER_ROLES, type User } from "../../models/User.model";
import { unauthorized, forbidden, badRequest, conflict } from "../../utils/errors";
import { adminTelegramIds } from "../../config/env";
import { hashPassword, verifyPassword } from "../../utils/password";
import { normalizeCountryCode, normalizePhoneE164, normalizeTelegramPhone } from "../../utils/phone";
import { UserService } from "../users/user.service";
import { WalletService } from "../wallet/wallet.service";
import { TelegramService } from "../telegram/telegram.service";
import { JwtService } from "./jwt.service";

function sanitizeUser(user: User) {
  return {
    id: user._id.toString(),
    telegramId: user.telegramId,
    username: user.username,
    telegramUsername: user.telegramUsername,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    phoneCountryCode: user.phoneCountryCode,
    phoneNationalNumber: user.phoneNationalNumber,
    phoneE164: user.phoneE164,
    phoneVerified: user.phoneVerified,
    phoneVerifiedAt: user.phoneVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    referralCode: user.referralCode,
    validReferralCount: user.validReferralCount,
    activePowerPercent: user.activePowerPercent,
    role: user.role,
    status: user.status
  };
}


export type RegisterInput = {
  username: string;
  countryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string;
  referralCode?: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw badRequest("La contraseña debe tener al menos 8 caracteres", "WEAK_PASSWORD");
  }
}


export class AuthService {

  static async register(input: RegisterInput) {
    const username = normalizeUsername(input.username);
    const countryCode = normalizeCountryCode(input.countryCode);
    const phoneNationalNumber = input.phoneNumber.replace(/\D+/g, "");
    const phoneE164 = normalizePhoneE164(countryCode, phoneNationalNumber);

    if (!username || username.length < 3) {
      throw badRequest("El usuario debe tener al menos 3 caracteres", "INVALID_USERNAME");
    }

    if (!/^[a-z0-9._-]{3,24}$/.test(username)) {
      throw badRequest("El usuario solo puede contener letras, números, punto, guion y guion bajo", "INVALID_USERNAME_FORMAT");
    }

    if (!phoneE164) {
      throw badRequest("Número de teléfono inválido", "INVALID_PHONE");
    }

    if (input.confirmPassword !== undefined && input.password !== input.confirmPassword) {
      throw badRequest("Las contraseñas no coinciden", "PASSWORD_CONFIRMATION_MISMATCH");
    }

    validatePassword(input.password);

    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      throw conflict("Este usuario ya existe", "USERNAME_ALREADY_USED");
    }

    const existingPhone = await UserModel.findOne({ phoneNumber: phoneE164 });
    if (existingPhone) {
      if (existingPhone.passwordHash) {
        throw conflict("Este teléfono ya está registrado. Usa Iniciar sesión.", "PHONE_ALREADY_USED");
      }

      // Migración segura para usuarios creados con la verificación anterior de Telegram:
      // si el teléfono existe pero no tiene contraseña, permitimos crear credenciales,
      // pero bloqueamos el login hasta que vuelva a confirmar el mismo número por Telegram.
      existingPhone.username = username;
      existingPhone.phoneCountryCode = countryCode;
      existingPhone.phoneNationalNumber = phoneNationalNumber;
      existingPhone.phoneE164 = phoneE164;
      existingPhone.phoneNumber = phoneE164;
      existingPhone.passwordHash = hashPassword(input.password);
      existingPhone.phoneVerified = false;
      existingPhone.phoneVerifiedAt = null;
      await existingPhone.save();

      const telegram = await TelegramService.createRegistrationSession({
        userId: existingPhone._id,
        expectedPhoneNumber: phoneE164,
        referralCode: input.referralCode
      });

      return {
        userId: existingPhone._id.toString(),
        username,
        phoneNumber: phoneE164,
        ...telegram
      };
    }

    const referralCode = await UserService.generateUniqueReferralCode();
    let referredByUserId = null;

    if (input.referralCode) {
      const sponsor = await UserModel.findOne({ referralCode: input.referralCode.trim().toUpperCase() });
      if (sponsor) {
        referredByUserId = sponsor._id;
      }
    }

    const role = adminTelegramIds.includes(phoneE164) ? USER_ROLES.ADMIN : USER_ROLES.USER;

    const user = await UserModel.create({
      username,
      passwordHash: hashPassword(input.password),
      phoneCountryCode: countryCode,
      phoneNationalNumber,
      phoneE164,
      phoneNumber: phoneE164,
      phoneVerified: false,
      referralCode,
      referredByUserId,
      role
    });

    await WalletService.createWalletForUser(user._id);

    const telegram = await TelegramService.createRegistrationSession({
      userId: user._id,
      expectedPhoneNumber: phoneE164,
      referralCode: input.referralCode
    });

    return {
      userId: user._id.toString(),
      username,
      phoneNumber: phoneE164,
      ...telegram
    };
  }

  static async login(input: LoginInput) {
    const identifier = input.identifier.trim();
    const identifierLower = identifier.toLowerCase();
    const phoneIdentifier = normalizeTelegramPhone(identifier);

    const user = await UserModel.findOne({
      $or: [
        { username: identifierLower },
        { phoneNumber: phoneIdentifier },
        { phoneE164: phoneIdentifier }
      ]
    });

    if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw unauthorized("Usuario o contraseña incorrectos", "INVALID_CREDENTIALS");
    }

    if (!user.phoneVerified) {
      throw forbidden("Debes verificar tu teléfono con Telegram antes de iniciar sesión", "PHONE_NOT_VERIFIED");
    }

    if (user.status !== USER_STATUSES.ACTIVE) {
      throw forbidden("User is blocked", "USER_BLOCKED");
    }

    user.lastLoginAt = new Date();
    await user.save();

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
