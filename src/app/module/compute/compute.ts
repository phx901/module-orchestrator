import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ComputeConfig } from './compute-config';
import { Result } from '../result';

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
