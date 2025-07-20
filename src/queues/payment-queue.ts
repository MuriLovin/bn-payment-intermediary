import { Queue } from "bullmq";
import { connection } from "../redis/connection";

export const paymentQueue = new Queue("payments", { connection });
