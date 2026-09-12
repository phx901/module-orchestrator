import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Compute } from './core/compute/compute';
import { Orchestrator } from './core/orchestrator/orchestrator';
import { createExampleModules } from './modules/example-modules';
import { OrchestratorStatus } from './ui/orchestrator-status/orchestrator-status';

@Component({
  imports: [OrchestratorStatus],
  selector: 'app-root',
  styleUrl: './app.css',
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

