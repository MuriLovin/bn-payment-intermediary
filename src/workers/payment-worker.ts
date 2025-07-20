import { Worker, QueueEvents } from "bullmq";
import { sql } from "bun";
import { ProcessorId } from "../types/processor-id";
import { RinhaPaymentProcessor } from "../providers/rinha-payment-processor";
import { connection } from "../redis/connection";

const pv1 = new RinhaPaymentProcessor();
const pv2 = new RinhaPaymentProcessor({ fallback: true });

export function startWorker() {
  let available = true;
  let provider = pv1;

  setTimeout(() => {
    console.log("available changed");
    available = true;
  }, 5000);

  return new Worker(
    "payments",
    async (job) => {
      const { amount, correlationId } = job.data;
      let processorId = ProcessorId.Default;

      if (available) {
        let [ph1, ph2] = await Promise.all([pv1.healthCheck(), pv2.healthCheck()]);

        const map = new Map([
          [ph1, pv1],
          [ph2, pv2],
        ]);

        let ph = [ph1, ph2].find((ph) => !ph.failing) || ph1;

        provider = map.get(ph) || provider;

        if (ph1.minResponseTime - ph2.minResponseTime > 0) {
          provider = pv2;
        }

        available = false;
      }

      let processorResult = await provider.send({
        correlationId,
        amount,
        requestedAt: new Date().toISOString(),
      });

      if (!processorResult) {
        available = true;
        throw new Error("Payment Rejected");
      }

      await sql`INSERT INTO payments (amount, correlation_id, processor_id) VALUES (${amount}, ${correlationId}, ${processorId})`;

      return "Payment received";
    },
    {
      concurrency: 3,
      lockDuration: 30000,
      connection,
    }
  );
}

const events = new QueueEvents("payments", { connection });
events.on("completed", ({ jobId, returnvalue }) => {
  console.log(`Job ${jobId} completed:`, returnvalue);
});

events.on("failed", ({ jobId, failedReason }) => {
  console.error(`Job ${jobId} failed:`, failedReason);
});
