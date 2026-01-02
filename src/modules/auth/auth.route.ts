import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middlewares/validation';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  googleLoginSchema,
  googleSignupSchema,
} from './auth.validation';

const router = Router();
const authController = new AuthController();


router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/google/signup', validate(googleSignupSchema), authController.googleSignup);
router.post('/google/login', validate(googleLoginSchema), authController.googleLogin);

export default router;
