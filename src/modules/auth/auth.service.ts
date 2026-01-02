import { Role } from '@prisma/client';
import { prisma } from '../../config/database';
import { hashPassword, comparePassword, generateSecureToken } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError, UnauthorizedError } from '../../middlewares/errorHandler';
import { GoogleAuthService } from './google-auth.service';
import {
  SignupInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  GoogleLoginInput,
  GoogleSignupInput,
} from './auth.validation';

export class AuthService {
  // Service for authentication and token management
  private googleAuthService = new GoogleAuthService();

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
    if (!user.password) {
      throw new UnauthorizedError('This account was created with Google. Please use Google to login.');
    }

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
    // Normalize token
    const token = data.refreshToken.replace(/^Bearer\s+/i, '').trim();

    // Verify token
    try {
      verifyRefreshToken(token);
    } catch (error: any) {
      console.error(`[AuthService] Refresh token verification failed: ${error.message}`);
      throw new UnauthorizedError(error.message);
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: token },
      include: { user: true },
    });

    if (!storedToken) {
      console.warn(`[AuthService] Refresh token not found in database: ${token.substring(0, 10)}...`);
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

  async googleSignup(data: GoogleSignupInput) {
    const payload = await this.googleAuthService.verifyIdToken(data.idToken);
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      throw new AppError('Google account must have an email', 400);
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
      include: { profile: true },
    });

    // Case 1: User does not exist
    if (!existingUser) {
      if (!data.role) {
        throw new AppError('Role selection is required', 400);
      }

      const user = await prisma.user.create({
        data: {
          email,
          googleId,
          provider: 'google',
          isVerified: true,
          role: data.role as Role,
          profile: {
            create: {
              firstName: name?.split(' ')[0] || 'User',
              lastName: name?.split(' ').slice(1).join(' ') || '',
              avatar: picture,
            },
          },
        },
        include: { profile: true },
      });

      return this.generateAuthResponse(user);
    }

    // Case 2 & 3: User exists (handle linking and roles)

    // 1. Try find by GoogleID
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { profile: true },
    });

    // If not found by GoogleID, try by Email to see if we should link or conflict
    if (!user) {
        const userByEmail = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });

        if (userByEmail) {
            // "Case 2" variation: Entity exists, but not linked.
            // Requirement says: "Case 2: Google account exists but has NO role". This implies "Google account" is the User entity.
            // Let's assume "Google account exists" means "User record found".
            
            // If we have a user by email, we treat them as "User exists".
            user = userByEmail;
            
            // Link the account now?
            // "If role is provided: Update the existing user with the role"
             if (data.role) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { 
                        googleId, 
                        provider: 'google',
                        isVerified: true,
                        role: data.role as Role // Overwrite role per "Case 2: If role is provided"
                    },
                    include: { profile: true }
                });
             } else {
                 // Check if they already have a role (Case 3 check)
                 // If they are an existing email user, they SURELY have a role (defaults to CUSTOMER usually).
                 // "Case 3: Google account exists and already HAS a role. Do NOT overwrite. Treat as login."
                 
                 // How do we distinguish "HAS a role" vs "NO role"?
                 // Creating a user usually assigns a default.
                 // Maybe we only update if they explicitly ASKED for a role?
                 // Requirement: "Case 2... If role is NOT provided: Return response indicating role selection is required".
                 // BUT "Case 3... If role is NOT provided... Treat as normal login".
                 
                 // Be careful: If I have an email account 'CUSTOMER', and I Google Signup without role...
                 // Should it fail (Case 2) or Login (Case 3)?
                 // "Case 3: Google account exists and already HAS a role." -> My email account HAS a role.
                 // So I should Login.
                 
                 // So "Case 2" implies a user state where role is null/undefined?
                 // If the schema allows null role, that's possible.
                 // If schema has default 'CUSTOMER', then every user HAS a role.
                 
                 // If we assume schema enforces role, then Case 2 only happens if we somehow have a phantom user or we treating "linking" as a state change.
                 
                 // Let's implement the linking logic safely:
                 // If we find user by email, update googleId. 
                 // If they passed a role, we update it (Case 2 logic kinda). 
                 // If they didn't pass a role, we keep existing (Case 3 logic).
                 
                 if (!user.googleId) {
                      await prisma.user.update({
                        where: { id: user.id },
                         data: { googleId, provider: 'google', isVerified: true },
                      });
                 }
            }
        } else {
            // Case 1: Absolutely new user
            if (!data.role) {
                throw new AppError('Role selection is required', 400);
            }
            // Create
            user = await prisma.user.create({
                data: {
                  email,
                  googleId,
                  provider: 'google',
                  isVerified: true,
                  role: data.role as Role,
                  profile: {
                    create: {
                      firstName: name?.split(' ')[0] || 'User',
                      lastName: name?.split(' ').slice(1).join(' ') || '',
                      avatar: picture,
                    },
                  },
                },
                include: { profile: true },
              });
        }
    } else {
        // Found by Google ID (Already signed up with Google)
        // Case 3: Google account exists and already HAS a role (it must, if it exists).
        // "Do NOT overwrite the role".
        // "Treat as normal login".
        // So we just proceed.
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    return this.generateAuthResponse(user);
  }

  async googleLogin(data: GoogleLoginInput) {
    const payload = await this.googleAuthService.verifyIdToken(data.idToken);
    const { sub: googleId } = payload;

    // Login Flow Logic
    // If Google account does NOT exist: Return error "Account not found..."
    
    // Check strict Google ID match first
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { profile: true },
    });

    if (!user) {
        // Fallback: Check by email to be friendly? 
        // Requirement says: "If the Google account does NOT exist: Return an error".
        // It does not explicitly say "check email". 
        // BUT, if I signed up with email, and allow Login with Google, I expect it to work if linked.
        // But if I haven't linked it (haven't done "Signup with Google"), should "Login with Google" auto-link?
        // Requirement 3: "Do NOT modify role or user data".
        // Auto-linking modifies user data (adds googleId).
        // So strict interpretation: If no googleId match, fail.
        // User must "Signup with Google" to link accounts.
        throw new AppError('Account not found. Please sign up first.', 404);
    }
    
    // Authenticate
    if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
    }

    return this.generateAuthResponse(user);
  }

  private async generateAuthResponse(user: any) {
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
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
        name: `${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`.trim(),
        avatar: user.profile?.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

}
