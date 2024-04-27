import { NameAnd } from "@laoban/utils";
import { DataSource } from "./sources.domain";

export type WorkerConfig = {
  source: DataSource
  workerCount: number;
  fileNameTemplate: string;
  batchSize: number;
  retryPolicy: RetryPolicyConfig;
  throttle?: number;
};

export type RetryPolicyConfig = {
  initialInterval: number; // In milliseconds
  maximumInterval: number; // In milliseconds
  maximumAttempts: number;
  nonRecoverableErrors?: string[];
};

export type SystemConfig = {
  sources: NameAnd<WorkerConfig>;
};

