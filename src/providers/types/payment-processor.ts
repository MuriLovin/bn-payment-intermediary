export namespace Payment {
  export type Data = {
    correlationId: string;
    amount: number;
    requestedAt: string;
  };

  export type Status = {
    failing: boolean;
    minResponseTime: number;
  };

  export interface Processor {
    send(data: Data): Promise<boolean>;
    healthCheck(): Promise<Status>;
    setFallback(status: boolean): void;
  }
}
