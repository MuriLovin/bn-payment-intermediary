import { Elysia } from "elysia";
import {
  PaymentController,
  PaymentRequestBodySchema,
  PaymentRequestQuerySchema,
} from "./controllers/payment-controller";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .get(
    "/payments-summary",
    ({ query }) => new PaymentController().getSummary(query),
    {
      query: PaymentRequestQuerySchema,
    }
  )
  .post(
    "/payments",
    ({ body }) => new PaymentController().createPayment(body),
    {
      body: PaymentRequestBodySchema,
    }
  )
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
