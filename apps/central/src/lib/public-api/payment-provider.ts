import { db } from "@/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  orderToken: string;
  amountBruttoGrosze: number;
  returnUrl: string;
}

export interface CreatePaymentResult {
  paymentId: string;
  paymentUrl: string;
}

export interface PaymentProvider {
  readonly name: string;
  createSession(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}

export class FakeProvider implements PaymentProvider {
  readonly name = "fake";

  async createSession(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const paymentId = `pay_${crypto.randomBytes(12).toString("hex")}`;
    await db.execute(sql`
      INSERT INTO payments (id, order_id, order_number, order_token, provider, amount_brutto_grosze, status, return_url)
      VALUES (
        ${paymentId},
        ${input.orderId},
        ${input.orderNumber},
        ${input.orderToken},
        ${this.name},
        ${input.amountBruttoGrosze},
        'pending',
        ${input.returnUrl}
      )
    `);

    return {
      paymentId,
      paymentUrl: `/pay/${paymentId}`,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new FakeProvider();
}
