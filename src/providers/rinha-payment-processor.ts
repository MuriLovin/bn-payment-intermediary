import { randomUUIDv7 } from "bun";
import { Payment } from "./types/payment-processor";

export type ProcessorOptions = {
  fallback: boolean;
};

export class RinhaPaymentProcessor implements Payment.Processor {
  private processorUrl: string | undefined;

  constructor(options?: ProcessorOptions) {
    this.setFallback(options?.fallback || false);
  }

  async send(data: Payment.Data): Promise<boolean> {
    data.correlationId = randomUUIDv7()
    const response = await fetch(`${this.processorUrl}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 200) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<Payment.Status> {
    const response = await fetch(`${this.processorUrl}/service-health`);
    return await response.json() as Payment.Status;
  }

  setFallback(status: boolean): void {
    if (status) {
      this.processorUrl = process.env.PAYMENT_PROCESSOR_FALLBACK_URL as string;
      return;
    }

    this.processorUrl = process.env.PAYMENT_PROCESSOR_DEFAULT_URL as string;
  }
}
