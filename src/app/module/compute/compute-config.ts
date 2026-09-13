import { Result } from '../result';

export interface ComputeConfig {
  durationMs: number;
  result: Result;
  failWith?: string;
}
