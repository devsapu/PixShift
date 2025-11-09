/**
 * Payment Service
 * Handles payment processing with Stripe and PayPal
 */

import Stripe from 'stripe';
import { getPaymentGatewayConfig } from '@/lib/config';
import { logger } from '@/utils/logger';
import { ErrorCode, ApplicationError, ErrorCategory } from '@/lib/errors';
import { createBillingRecord, updateBillingRecordStatus } from './billing';
import { BillingStatus } from '@prisma/client';

export interface PaymentRequest {
  userId: string;
  transformationId: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
}

export class PaymentService {
  private stripe: Stripe | null = null;
  private config: ReturnType<typeof getPaymentGatewayConfig>;

  constructor() {
    this.config = getPaymentGatewayConfig();

    if (this.config.gateway.primary === 'stripe' && this.config.stripe.enabled) {
      if (!this.config.stripe.secretKey) {
        throw new ApplicationError(
          ErrorCode.API_ERROR,
          'Stripe secret key is not configured',
          ErrorCategory.API,
          500
        );
      }

      this.stripe = new Stripe(this.config.stripe.secretKey, {
        apiVersion: this.config.stripe.apiVersion as any,
      });
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (this.config.gateway.primary === 'stripe' && this.stripe) {
        return await this.createStripePaymentIntent(request);
      } else {
        throw new ApplicationError(
          ErrorCode.API_ERROR,
          'Payment gateway not configured',
          ErrorCategory.API,
          500
        );
      }
    } catch (error: any) {
      logger.error('Failed to create payment intent', {
        userId: request.userId,
        transformationId: request.transformationId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create Stripe payment intent
   */
  private async createStripePaymentIntent(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.stripe) {
      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Stripe not initialized',
        ErrorCategory.API,
        500
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        description: request.description || `Transformation ${request.transformationId}`,
        metadata: {
          userId: request.userId,
          transformationId: request.transformationId,
        },
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };
    } catch (error: any) {
      logger.error('Stripe payment intent creation failed', {
        error: error.message,
        stack: error.stack,
      });

      throw new ApplicationError(
        ErrorCode.PAYMENT_GATEWAY_ERROR,
        'Failed to create payment intent',
        ErrorCategory.BILLING,
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(
    paymentIntentId: string,
    transformationId: string
  ): Promise<PaymentResponse> {
    try {
      if (this.config.gateway.primary === 'stripe' && this.stripe) {
        return await this.confirmStripePayment(paymentIntentId, transformationId);
      } else {
        throw new ApplicationError(
          ErrorCode.API_ERROR,
          'Payment gateway not configured',
          ErrorCategory.API,
          500
        );
      }
    } catch (error: any) {
      logger.error('Failed to confirm payment', {
        paymentIntentId,
        transformationId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Confirm Stripe payment
   */
  private async confirmStripePayment(
    paymentIntentId: string,
    transformationId: string
  ): Promise<PaymentResponse> {
    if (!this.stripe) {
      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Stripe not initialized',
        ErrorCategory.API,
        500
      );
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update billing record
        const billingRecord = await this.findBillingRecordByTransformation(transformationId);
        if (billingRecord) {
          await updateBillingRecordStatus(
            billingRecord.id,
            BillingStatus.COMPLETED,
            paymentIntentId
          );
        }

        return {
          success: true,
          transactionId: paymentIntentId,
        };
      } else if (paymentIntent.status === 'requires_payment_method') {
        throw new ApplicationError(
          ErrorCode.PAYMENT_DECLINED,
          'Payment requires a payment method',
          ErrorCategory.BILLING,
          402
        );
      } else {
        throw new ApplicationError(
          ErrorCode.PAYMENT_GATEWAY_ERROR,
          `Payment status: ${paymentIntent.status}`,
          ErrorCategory.BILLING,
          402
        );
      }
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      logger.error('Stripe payment confirmation failed', {
        error: error.message,
        stack: error.stack,
      });

      throw new ApplicationError(
        ErrorCode.PAYMENT_GATEWAY_ERROR,
        'Failed to confirm payment',
        ErrorCategory.BILLING,
        500,
        { originalError: error.message }
      );
    }
  }

  /**
   * Find billing record by transformation ID
   */
  private async findBillingRecordByTransformation(transformationId: string) {
    const { prisma } = await import('@/lib/db');
    return await prisma.billingRecord.findUnique({
      where: { transformationId },
    });
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(event: any, signature: string): Promise<void> {
    try {
      if (this.config.gateway.primary === 'stripe' && this.stripe) {
        await this.handleStripeWebhook(event, signature);
      }
    } catch (error: any) {
      logger.error('Webhook handling failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   */
  private async handleStripeWebhook(event: any, signature: string): Promise<void> {
    if (!this.stripe || !this.config.stripe.webhookSecret) {
      throw new ApplicationError(
        ErrorCode.API_ERROR,
        'Stripe webhook not configured',
        ErrorCategory.API,
        500
      );
    }

    try {
      // Verify webhook signature
      const stripeEvent = this.stripe.webhooks.constructEvent(
        event.body,
        signature,
        this.config.stripe.webhookSecret
      );

      // Handle different event types
      switch (stripeEvent.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(stripeEvent.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(stripeEvent.data.object as Stripe.PaymentIntent);
          break;
        default:
          logger.info('Unhandled webhook event type', { type: stripeEvent.type });
      }
    } catch (error: any) {
      logger.error('Stripe webhook handling failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle payment success
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const transformationId = paymentIntent.metadata?.transformationId;
    if (transformationId) {
      const billingRecord = await this.findBillingRecordByTransformation(transformationId);
      if (billingRecord) {
        await updateBillingRecordStatus(
          billingRecord.id,
          BillingStatus.COMPLETED,
          paymentIntent.id
        );
      }
    }
  }

  /**
   * Handle payment failure
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const transformationId = paymentIntent.metadata?.transformationId;
    if (transformationId) {
      const billingRecord = await this.findBillingRecordByTransformation(transformationId);
      if (billingRecord) {
        await updateBillingRecordStatus(billingRecord.id, BillingStatus.FAILED, paymentIntent.id);
      }
    }
  }
}

// Singleton instance
let paymentService: PaymentService | null = null;

export function getPaymentService(): PaymentService {
  if (!paymentService) {
    paymentService = new PaymentService();
  }
  return paymentService;
}

