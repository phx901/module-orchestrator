export type ResultStatus = 'ok' | 'warning' | 'error';

export interface Result<T = unknown> {
  status: ResultStatus;
  message?: string;
  value?: T;
}
