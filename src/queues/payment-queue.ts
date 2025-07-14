import Queue from "bull";
import { RinhaPaymentProcessor } from "../providers/rinha-payment-processor";
import { ProcessorId } from "../types/processor-id";
import { sql } from "bun";

export const paymentQueue = new Queue("process-payment", {
  redis: {
    port: 6379,
    host: "localhost",
  },
});

paymentQueue.process(async (job) => {
  const provider = new RinhaPaymentProcessor();
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
    Promise.reject({
      message: "Payment Rejected",
      amount,
      correlationId,
    });
  }

  await sql`INSERT INTO payments (amount, correlation_id, processor_id) VALUES (${amount}, ${correlationId}, ${processorId})`;

  Promise.resolve({
    message: "Payment received",
    amount,
    correlationId,
  });
});

paymentQueue.on('completed', (job, result) => {
  console.log(`Job ID ${job.id} completed with result:`, result);
});

paymentQueue.on('failed', (job, err) => {
  console.error(`Job ID ${job.id} failed with error:`, err);
});
