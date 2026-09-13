import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModuleId } from '../../module-definition';
import { ModuleStatus } from '../../module-state';
import { STATUS_CLASSES, STATUS_LABELS } from './module-status-display';

@Component({
  selector: 'app-module-header',
  templateUrl: './module-header.html',
  styleUrl: './module-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleHeader {
  readonly id = input.required<ModuleId>();
  readonly status = input.required<ModuleStatus>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.status()]);
}
