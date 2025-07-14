import { sql } from "bun";
import { t } from "elysia";
import { Payment } from "../providers/types/payment-processor";
import { RinhaPaymentProcessor } from "../providers/rinha-payment-processor";
import { ProcessorId } from "../types/processor-id";
import { paymentQueue } from "../queues/payment-queue";

export const PaymentRequestBodySchema = t.Object({
  correlationId: t.String(),
  amount: t.Number(),
});

export type PaymentRequestBody = typeof PaymentRequestBodySchema.static;

export const PaymentRequestQuerySchema = t.Optional(
  t.Object({
    from: t.Optional(t.Date()),
    to: t.Optional(t.Date()),
  })
);

export type PaymentRequestQuery = typeof PaymentRequestQuerySchema.static;

export class PaymentController {
  private provider: Payment.Processor;

  constructor() {
    this.provider = new RinhaPaymentProcessor();
  }

  async createPayment(data: PaymentRequestBody) {
    paymentQueue.add({
      data,
    });

    return {
      success: true,
      message: "Payment received",
    };
  }

  async getSummary(data: PaymentRequestQuery) {
    const { from, to } = data;

    let filter = sql``;

    if (from && to) {
      filter = sql`WHERE created_at >= ${from} && created_at <= ${to}`;
    } else if (from) {
      filter = sql`WHERE created_at >= ${from}`;
    } else if (to) {
      filter = sql`WHERE created_at <= ${to}`;
    }

    const rows = await sql`
        SELECT COUNT(id) as total_requests, SUM(amount) as total_amount, processor_id FROM payments
        ${filter}
        GROUP BY processor_id
    `;

    const response: Record<
      string,
      {
        totalRequests: number;
        totalAmount: number;
      }
    > = {};

    rows.forEach(
      (row: {
        total_requests: number;
        total_amount: number;
        processor_id: number;
      }) => {
        if (row.processor_id === ProcessorId.Default) {
          response.default = {
            totalRequests: Number(row.total_requests),
            totalAmount: Number(row.total_amount),
          };

          return;
        }

        if (row.processor_id === ProcessorId.Fallback) {
          response.fallback = {
            totalRequests: Number(row.total_requests),
            totalAmount: Number(row.total_amount),
          };
        }
      }
    );

    return response;
  }
}
