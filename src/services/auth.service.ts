import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { ENV } from '../config/env';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { SignupInput, LoginInput } from '../schemas/user.schema';
import { MESSAGES } from '../constants/messages';

export class AuthService {
  static async signup(data: SignupInput) {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError(MESSAGES.USER_EXISTS);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      email: data.email,
      passwordHash,
      name: data.name,
    });

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    return userJson;
  }

  static async login(data: LoginInput) {
    const user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    const signOptions: SignOptions = {
      expiresIn: ENV.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, signOptions);

    const userJson = user.toJSON();
    delete userJson.passwordHash;
    return {
      user: userJson,
      token,
    };
  }
}
