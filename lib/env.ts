'use client'

// Environment configuration
export const env = {
  // Check if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  
  // Check if we're in development
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Check if we're in test
  isTest: process.env.NODE_ENV === 'test',
  
  // App environment from NEXT_PUBLIC_APP_ENV
  // This allows us to have a staging environment that behaves like production
  // but still allows certain development features
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // Check if we're in a production-like environment (production or staging)
  isProductionLike: () => {
    return process.env.NODE_ENV === 'production' || 
           process.env.NEXT_PUBLIC_APP_ENV === 'production' ||
           process.env.NEXT_PUBLIC_APP_ENV === 'staging';
  },
  
  // Check if role selector should be enabled
  // Only enabled in development or when explicitly allowed
  isRoleSelectorEnabled: () => {
    return process.env.NODE_ENV !== 'production' || 
           process.env.NEXT_PUBLIC_ENABLE_ROLE_SELECTOR === 'true';
  }
}
