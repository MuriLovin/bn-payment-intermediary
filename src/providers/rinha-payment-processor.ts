import { randomUUIDv7 } from "bun";
import { Payment } from "./types/payment-processor";
import { ProcessorId } from "../types/processor-id";

export type ProcessorOptions = {
  fallback: boolean;
};

export class RinhaPaymentProcessor implements Payment.Processor {
  private processorUrl: string | undefined;
  private processorId: ProcessorId;

  constructor(options?: ProcessorOptions) {
    if (options?.fallback) {
      this.processorId = ProcessorId.Fallback;
      this.setFallback(true);
      return;
    }

    this.processorId = ProcessorId.Default;
    this.setFallback(false);
  }

  getProcessorId() {
    return this.processorId;
  }

  async send(data: Payment.Data): Promise<boolean> {
    data.correlationId = randomUUIDv7();
    const response = await fetch(`${this.processorUrl}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 200) {
      return false;
    }

    return true;
  }

  async healthCheck(): Promise<Payment.Status> {
    const response = await fetch(`${this.processorUrl}/payments/service-health`);

    if (response.status === 200) {
      const result = await response.json();

      return result;
    }

    return {
      failing: true,
      minResponseTime: Infinity
    }
  }

  setFallback(status: boolean): void {
    if (status) {
      this.processorUrl = process.env.PAYMENT_PROCESSOR_FALLBACK_URL as string;
      return;
    }

    this.processorUrl = process.env.PAYMENT_PROCESSOR_DEFAULT_URL as string;
  }
}
