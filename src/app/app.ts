import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Compute } from './module/compute/compute';
import { Orchestrator } from './orchestrator/orchestrator';
import { createExampleModules } from './module/demo/example-modules';
import { OrchestratorGraph } from './orchestrator/orchestrator-graph/orchestrator-graph';
import { Button } from './ui/button/button';

@Component({
  imports: [OrchestratorGraph, Button],
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly orchestrator = inject(Orchestrator);
  private readonly compute = inject(Compute);

  constructor() {
    this.orchestrator.register(createExampleModules(this.compute));
  }

  protected start(): void {
    this.orchestrator.run();
  }
}

