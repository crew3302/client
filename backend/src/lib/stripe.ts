import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️ Stripe secret key not configured. Payment features will be disabled.');
}

export const stripe = stripeSecretKey 
  ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })
  : null;

export const STRIPE_PRICES = {
  starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly',
  practice: process.env.STRIPE_PRACTICE_PRICE_ID || 'price_practice_monthly',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
};
