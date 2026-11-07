import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModuleState } from '../../module-state';

@Component({
  selector: 'app-module-content',
  templateUrl: './module-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleContent {
  readonly state = input<ModuleState | undefined>();

  protected readonly message = computed(() => this.state()?.result?.message);
  protected readonly value = computed(() => this.state()?.result?.value);
}
