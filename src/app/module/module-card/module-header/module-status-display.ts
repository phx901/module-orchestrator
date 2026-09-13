import { ModuleStatus } from '../../module-state';

export const STATUS_LABELS: Record<ModuleStatus, string> = {
  Pending: 'Wartet',
  Blocked: 'Wartet',
  Running: 'Läuft',
  Completed: 'Erfolgreich',
  Failed: 'Fehler',
};

export const STATUS_CLASSES: Record<ModuleStatus, string> = {
  Pending: 'status-pending',
  Blocked: 'status-pending',
  Running: 'status-running',
  Completed: 'status-completed',
  Failed: 'status-failed',
};
