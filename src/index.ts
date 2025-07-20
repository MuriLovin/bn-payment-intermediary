import { Elysia } from "elysia";
import {
  PaymentController,
  PaymentRequestBodySchema,
  PaymentRequestQuerySchema,
} from "./controllers/payment-controller";
import { startWorker } from "./workers/payment-worker";

const PORT = process.env.PORT || 3000;

const controller = new PaymentController();

const app = new Elysia()
  .get(
    "/payments-summary",
    ({ query }) => controller.getSummary(query),
    {
      query: PaymentRequestQuerySchema,
    }
  )
  .post(
    "/payments",
    ({ body }) => controller.createPayment(body),
    {
      body: PaymentRequestBodySchema,
    }
  )
  .post("/purge-payments", () => controller.purgePayments())
  .listen(PORT);

startWorker();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
