import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Result } from '../orchestrator/result';

export interface ComputeConfig {
  durationMs: number;
  result: Result;
  failWith?: string;
}

@Injectable({ providedIn: 'root' })
export class Compute {
  run(config: ComputeConfig): Observable<Result> {
    return timer(config.durationMs).pipe(
      switchMap(() =>
        config.failWith ? throwError(() => new Error(config.failWith)) : of(config.result),
      ),
    );
  }
}
