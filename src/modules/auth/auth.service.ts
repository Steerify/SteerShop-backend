import { Role } from '../../types';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword, generateSecureToken } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError, UnauthorizedError } from '../../middlewares/errorHandler';
import {
  SignupInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validation';

export class AuthService {
  async signup(data: SignupInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and profile in a transaction
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role as Role,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    // TODO: Send verification email
    // This is where you would integrate with your email service
    // For now, we'll just log it
    console.log(`📧 Verification email should be sent to ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role as any,
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        profile: user.profile,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(data: RefreshTokenInput) {
    // Verify token
    /* const _payload = */ verifyRefreshToken(data.refreshToken);

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: data.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Generate new tokens
    const accessToken = generateAccessToken({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as any,
    });

    const newRefreshToken = generateRefreshToken({
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as any,
    });

    // Delete old refresh token and create new one (token rotation)
    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { id: storedToken.id },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: storedToken.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    // Store reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // TODO: Send password reset email
    console.log(`📧 Password reset email should be sent to ${user.email}`);
    console.log(`Reset token: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(data: ResetPasswordInput) {
    // Find reset token
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: data.token },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Check if token is expired
    if (resetRecord.expiresAt < new Date()) {
      throw new AppError('Reset token has expired', 400);
    }

    // Check if token has been used
    if (resetRecord.used) {
      throw new AppError('Reset token has already been used', 400);
    }

    // Hash new password
    const hashedPassword = await hashPassword(data.password);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Delete all refresh tokens for this user
      prisma.refreshToken.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  async verifyEmail(_token: string) {
    // TODO: Implement email verification logic
    // This would involve storing verification tokens similar to password reset
    // For now, we'll just return a placeholder
    throw new AppError('Email verification not yet implemented', 501);
  }
}
