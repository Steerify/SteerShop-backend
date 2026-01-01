import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { config } from '../../config/env';
import { AppError } from '../../middlewares/errorHandler';

const client = new OAuth2Client(config.google.clientId);

export class GoogleAuthService {
  /**
   * Verifies the Google ID token and returns the payload
   * @param idToken The ID token from the frontend
   * @returns The token payload containing user info
   */
  async verifyIdToken(idToken: string): Promise<TokenPayload> {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new AppError('Invalid Google token payload', 400);
      }

      // Explicit verification (already handled by verifyIdToken but good for clarity)
      if (payload.aud !== config.google.clientId) {
        throw new AppError('Invalid Google token audience', 400);
      }

      return payload;
    } catch (error: any) {
      console.error('Google Token Verification Error:', error.message);
      throw new AppError('Google authentication failed: ' + (error.message || 'Invalid token'), 401);
    }
  }
}
