import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleId } from '../../module';
import { ModuleStatus } from '../../module-state';
import { Button } from '../../../ui/button/button';
import { STATUS_CLASSES, STATUS_LABELS } from './module-status-display';

@Component({
  selector: 'app-module-header',
  imports: [Button],
  templateUrl: './module-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleHeader {
  readonly id = input.required<ModuleId>();
  readonly status = input.required<ModuleStatus>();
  readonly retry = output<ModuleId>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.status()]);
  protected readonly isFailed = computed(() => this.status() === 'Failed');

  protected onRetry(): void {
    this.retry.emit(this.id());
  }
}
