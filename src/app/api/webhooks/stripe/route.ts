/**
 * Stripe Webhook Endpoint
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentService } from '@/services/payment';
import { handleError } from '@/lib/errorHandler';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const paymentService = getPaymentService();
    await paymentService.handleWebhook({ body }, signature);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleError(error);
  }
}

