import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { IconName } from '../icon/icons';
import { BUTTON_STYLES, ButtonStatus, ButtonVariant } from './button-styles';

@Component({
  selector: 'app-button',
  imports: [Icon],
  templateUrl: './button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  readonly label = input<string>();
  readonly icon = input<IconName>();
  readonly variant = input<ButtonVariant>('primary');
  readonly status = input<ButtonStatus>('default');
  readonly disabled = input(false);

  protected readonly classes = computed(() => {
    const base =
      'rounded cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5';
    const size = this.icon() && !this.label() ? 'p-1.5' : 'px-4 py-2';
    return `${base} ${BUTTON_STYLES[this.variant()][this.status()]} ${size}`;
  });
}
