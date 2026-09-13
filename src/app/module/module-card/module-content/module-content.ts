import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModuleId } from '../../module-definition';
import { ModuleState } from '../../module-state';

@Component({
  selector: 'app-module-content',
  templateUrl: './module-content.html',
  styleUrl: './module-content.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleContent {
  readonly id = input.required<ModuleId>();
  readonly state = input<ModuleState | undefined>();
  readonly retry = output<ModuleId>();

  protected readonly message = computed(() => this.state()?.result?.message);
  protected readonly value = computed(() => this.state()?.result?.value);
  protected readonly isFailed = computed(() => this.state()?.status === 'Failed');

  protected onRetry(): void {
    this.retry.emit(this.id());
  }
}
