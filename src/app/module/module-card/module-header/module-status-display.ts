import { ModuleStatus } from '../../module-state';

export const STATUS_LABELS: Record<ModuleStatus, string> = {
  Pending: 'Wartet',
  Blocked: 'Wartet',
  Running: 'Läuft',
  Completed: 'Erfolgreich',
  Failed: 'Fehler',
};

export const STATUS_CLASSES: Record<ModuleStatus, string> = {
  Pending: 'border-l-neutral text-neutral',
  Blocked: 'border-l-neutral text-neutral',
  Running: 'border-l-primary-light text-primary-light',
  Completed: 'border-l-success text-success',
  Failed: 'border-l-error text-error',
};
