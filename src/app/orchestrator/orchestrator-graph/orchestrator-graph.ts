import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModuleId } from '../../module/module';
import { Orchestrator } from '../orchestrator';
import { ModuleCard } from '../../module/module-card/module-card';
import { computeGraphLayout } from './layout/compute-graph-layout';

@Component({
  selector: 'app-orchestrator-graph',
  imports: [ModuleCard],
  templateUrl: './orchestrator-graph.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrchestratorGraph {
  private readonly orchestrator = inject(Orchestrator);

  protected readonly states = this.orchestrator.states;
  protected readonly layout = computed(() => computeGraphLayout(this.orchestrator.modules()));

  protected retry(id: ModuleId): void {
    this.orchestrator.retry(id);
  }
}
