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
    algorithm: 'HS256',
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
    algorithm: 'HS256',
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    }
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  } catch (error: any) {
    console.error(`[JWT] Refresh token verification failed: ${error.name} - ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    }
    throw new Error('Invalid or expired refresh token');
  }
};
