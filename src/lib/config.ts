/**
 * Configuration Loader
 * Loads and validates configuration from YAML files
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export interface GeminiConfig {
  api: {
    key: string;
    endpoint: string;
    model: string;
  };
  timeout: {
    request: number;
    connection: number;
  };
  retry: {
    maxAttempts: number;
    backoff: {
      initial: number;
      multiplier: number;
      max: number;
    };
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  prompt: {
    systemMessage: string;
    maxTokens: number;
  };
}

export interface PricingTier {
  name: string;
  description: string;
  features: {
    maxTransformations: number;
    transformationsPerMonth: number;
    imageSizeLimit: number;
    supportedFormats: string[];
  };
  pricing: {
    model: 'free' | 'pay-per-use' | 'monthly';
    amount: number;
    currency: string;
  };
}

export interface PricingTiersConfig {
  tiers: {
    free: PricingTier;
    basic: PricingTier;
    premium: PricingTier;
  };
  defaultTier: string;
}

export interface PaymentGatewayConfig {
  gateway: {
    type: string;
    primary: string;
  };
  stripe: {
    enabled: boolean;
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
    webhookEndpoint: string;
    currency: string;
    apiVersion: string;
  };
  paypal: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    mode: string;
    currency: string;
  };
}

export interface SMSOTPConfig {
  provider: {
    type: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    apiUrl: string;
  };
  otp: {
    length: number;
    expiration: number;
    maxAttempts: number;
    resendCooldown: number;
    allowedChars: string;
  };
  message: {
    template: string;
    from: string;
  };
}

class ConfigLoader {
  private configDir: string;
  private geminiConfig: GeminiConfig | null = null;
  private pricingTiersConfig: PricingTiersConfig | null = null;
  private paymentGatewayConfig: PaymentGatewayConfig | null = null;
  private smsOtpConfig: SMSOTPConfig | null = null;

  constructor(configDir: string = path.join(process.cwd(), 'config')) {
    this.configDir = configDir;
  }

  /**
   * Load configuration from YAML file
   */
  private loadYamlFile<T>(filename: string): T {
    const filePath = path.join(this.configDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Configuration file not found: ${filePath}`);
    }

    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const config = yaml.load(fileContents) as T;
      
      // Replace environment variables
      return this.replaceEnvVars(config) as T;
    } catch (error: any) {
      throw new Error(`Failed to load configuration file ${filename}: ${error.message}`);
    }
  }

  /**
   * Replace environment variable placeholders in config
   */
  private replaceEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      // Replace ${VAR_NAME} with process.env.VAR_NAME
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          throw new Error(`Environment variable ${varName} is not set`);
        }
        return value;
      });
    } else if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceEnvVars(item));
    } else if (obj !== null && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.replaceEnvVars(obj[key]);
      }
      return result;
    }
    return obj;
  }

  /**
   * Load all configurations
   */
  loadAll(): void {
    try {
      this.geminiConfig = this.loadYamlFile<GeminiConfig>('gemini-api.yaml');
      this.pricingTiersConfig = this.loadYamlFile<PricingTiersConfig>('pricing-tiers.yaml');
      this.paymentGatewayConfig = this.loadYamlFile<PaymentGatewayConfig>('payment-gateway.yaml');
      this.smsOtpConfig = this.loadYamlFile<SMSOTPConfig>('sms-otp.yaml');
    } catch (error: any) {
      console.error('Failed to load configuration:', error.message);
      throw error;
    }
  }

  /**
   * Get Gemini API configuration
   */
  getGeminiConfig(): GeminiConfig {
    if (!this.geminiConfig) {
      this.geminiConfig = this.loadYamlFile<GeminiConfig>('gemini-api.yaml');
    }
    return this.geminiConfig;
  }

  /**
   * Get pricing tiers configuration
   */
  getPricingTiersConfig(): PricingTiersConfig {
    if (!this.pricingTiersConfig) {
      this.pricingTiersConfig = this.loadYamlFile<PricingTiersConfig>('pricing-tiers.yaml');
    }
    return this.pricingTiersConfig;
  }

  /**
   * Get payment gateway configuration
   */
  getPaymentGatewayConfig(): PaymentGatewayConfig {
    if (!this.paymentGatewayConfig) {
      this.paymentGatewayConfig = this.loadYamlFile<PaymentGatewayConfig>('payment-gateway.yaml');
    }
    return this.paymentGatewayConfig;
  }

  /**
   * Get SMS OTP configuration
   */
  getSMSOTPConfig(): SMSOTPConfig {
    if (!this.smsOtpConfig) {
      this.smsOtpConfig = this.loadYamlFile<SMSOTPConfig>('sms-otp.yaml');
    }
    return this.smsOtpConfig;
  }

  /**
   * Validate configuration
   */
  validate(): void {
    // Validate Gemini config
    const gemini = this.getGeminiConfig();
    if (!gemini.api.key) {
      throw new Error('GEMINI_API_KEY is required');
    }

    // Validate payment gateway config
    const payment = this.getPaymentGatewayConfig();
    if (payment.gateway.primary === 'stripe' && !payment.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required when using Stripe');
    }

    // Validate SMS OTP config
    const sms = this.getSMSOTPConfig();
    if (sms.provider.type === 'twilio') {
      if (!sms.twilio.accountSid || !sms.twilio.authToken) {
        throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required');
      }
    }
  }
}

// Singleton instance
let configLoader: ConfigLoader | null = null;

export function getConfigLoader(): ConfigLoader {
  if (!configLoader) {
    configLoader = new ConfigLoader();
    try {
      configLoader.loadAll();
      configLoader.validate();
    } catch (error) {
      console.error('Configuration validation failed:', error);
      // In production, you might want to exit here
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
  return configLoader;
}

// Export convenience functions
export function getGeminiConfig(): GeminiConfig {
  return getConfigLoader().getGeminiConfig();
}

export function getPricingTiersConfig(): PricingTiersConfig {
  return getConfigLoader().getPricingTiersConfig();
}

export function getPaymentGatewayConfig(): PaymentGatewayConfig {
  return getConfigLoader().getPaymentGatewayConfig();
}

export function getSMSOTPConfig(): SMSOTPConfig {
  return getConfigLoader().getSMSOTPConfig();
}

