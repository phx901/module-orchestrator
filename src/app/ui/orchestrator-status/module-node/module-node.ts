import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleId, ModuleState, ModuleStatus } from '../../../core/orchestrator/module-types';

const STATUS_LABELS: Record<ModuleStatus, string> = {
  Pending: 'Wartet',
  Ready: 'Wartet',
  Blocked: 'Wartet',
  Running: 'Läuft',
  Completed: 'Erfolgreich',
  Failed: 'Fehler',
};

const STATUS_CLASSES: Record<ModuleStatus, string> = {
  Pending: 'status-pending',
  Ready: 'status-pending',
  Blocked: 'status-pending',
  Running: 'status-running',
  Completed: 'status-completed',
  Failed: 'status-failed',
};

@Component({
  selector: 'app-module-node',
  templateUrl: './module-node.html',
  styleUrl: './module-node.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleNode {
  readonly id = input.required<ModuleId>();
  readonly state = input<ModuleState | undefined>();
  readonly retry = output<ModuleId>();

  protected readonly status = computed<ModuleStatus>(() => this.state()?.status ?? 'Pending');
  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.status()]);
  protected readonly message = computed(() => this.state()?.result?.message);
  protected readonly value = computed(() => this.state()?.result?.value);
  protected readonly isFailed = computed(() => this.status() === 'Failed');

  protected onRetry(): void {
    this.retry.emit(this.id());
  }
}
