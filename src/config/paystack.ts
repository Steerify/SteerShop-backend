import { config } from './env';

export const paystackConfig = {
  secretKey: config.paystack.secretKey,
  publicKey: config.paystack.publicKey,
  baseUrl: 'https://api.paystack.co',
};

export const paystackHeaders = {
  Authorization: `Bearer ${paystackConfig.secretKey}`,
  'Content-Type': 'application/json',
};
