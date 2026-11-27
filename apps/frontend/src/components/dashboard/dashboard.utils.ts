type TranslateFn = (key: string, fallback: string, vars?: Record<string, unknown>) => string;

// Pattern C helper — single source of truth in the shared module; re-exported
// here so dashboard/hooks/*.ts can keep importing it from '../dashboard.utils'.
export {
  createFetchError,
  type FetchError,
} from '@postmill-ai/frontend/components/settings/shared/fetch-error';

export function greetingForUser(name: string, hour: number, t: TranslateFn) {
  if (hour < 5) return t('greeting_working_late', 'Working Late, {{name}}?', { name });
  if (hour < 12) return t('greeting_good_morning', 'Good Morning, {{name}}', { name });
  if (hour < 17) return t('greeting_good_afternoon', 'Good Afternoon, {{name}}', { name });
  if (hour < 22) return t('greeting_good_evening', 'Good Evening, {{name}}', { name });
  return t('greeting_good_night', 'Good Night, {{name}}', { name });
}
