import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthUser } from '../types/express';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: AuthUser): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.accessSecret as jwt.Secret, {
    expiresIn: config.jwt.accessExpiry as any,
  });
};

export const generateRefreshToken = (user: AuthUser): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};
