import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleId } from '../module-definition';
import { ModuleState, ModuleStatus } from '../module-state';
import { ModuleHeader } from './module-header/module-header';
import { ModuleContent } from './module-content/module-content';

@Component({
  selector: 'app-module-card',
  imports: [ModuleHeader, ModuleContent],
  templateUrl: './module-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleCard {
  readonly id = input.required<ModuleId>();
  readonly state = input<ModuleState | undefined>();
  readonly retry = output<ModuleId>();

  protected readonly status = computed<ModuleStatus>(() => this.state()?.status ?? 'Pending');

  protected onRetry(): void {
    this.retry.emit(this.id());
  }
}
