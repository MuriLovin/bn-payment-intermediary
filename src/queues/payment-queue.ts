import Queue from "bull";
import { ProcessorId } from "../types/processor-id";
import { RinhaPaymentProcessor } from "../providers/rinha-payment-processor";
import { sql } from "bun";

const provider = new RinhaPaymentProcessor();

export const paymentQueue = new Queue("payment", {
  redis: {
    host: process.env.REDIS_HOST as string,
    port: Number(process.env.REDIS_PORT),
  },
});

paymentQueue.on("error", (error) => {
  console.error("Error processing payment:", error);
});

paymentQueue.on("failed", (job, error) => {
  console.error("Payment failed:", job.id, error);
});

paymentQueue.on("completed", (job) => {
  console.log(
    "Payment completed:",
    job.data?.correlationId || job.id,
    job.data?.amount
  );
});

paymentQueue.process(async (job) => {
  const { amount, correlationId } = job.data;

  let processorId = ProcessorId.Default;
  let processorResult = await provider.send({
    correlationId,
    amount,
    requestedAt: new Date().toISOString(),
  });

  if (!processorResult) {
    provider.setFallback(true);
    processorId = ProcessorId.Fallback;
    processorResult = await provider.send({
      correlationId,
      amount,
      requestedAt: new Date().toISOString(),
    });
  }

  if (!processorResult) {
    throw new Error("Payment Rejected");
  }

  await sql`INSERT INTO payments (amount, correlation_id, processor_id) VALUES (${amount}, ${correlationId}, ${processorId})`;

  return "Payment received";
});
