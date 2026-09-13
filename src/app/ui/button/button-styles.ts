export type ButtonVariant = 'primary' | 'secondary';
export type ButtonStatus = 'default' | 'error';

export const BUTTON_STYLES: Record<ButtonVariant, Record<ButtonStatus, string>> = {
  primary: {
    default: 'border-primary bg-primary text-on-primary hover:bg-primary-dark hover:border-primary-dark',
    error: 'border-error bg-error text-on-error hover:bg-error-dark hover:border-error-dark',
  },
  secondary: {
    default: 'border-primary bg-primary/10 text-primary hover:bg-primary/20',
    error: 'border-error bg-error/10 text-error hover:bg-error/20',
  },
};
