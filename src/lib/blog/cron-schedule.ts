import type { PublishSchedule } from '@/types/blog';

const KST_TIMEZONE = 'Asia/Seoul';

function getKstDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    dayOfWeek: weekdayMap[weekday] ?? 0,
    hour,
    minute,
    timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
  };
}

export function normalizePublishHour(publishTime: string): string {
  const [hourStr] = publishTime.trim().split(':');
  const hour = Number(hourStr);

  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return '09:00';
  }

  return `${String(hour).padStart(2, '0')}:00`;
}

export function matchesPublishTime(publishTime: string, now = new Date()): boolean {
  const targetHour = Number(normalizePublishHour(publishTime).split(':')[0]);

  if (Number.isNaN(targetHour)) {
    return false;
  }

  const { hour, minute } = getKstDateParts(now);
  return hour === targetHour && minute === 0;
}

export function matchesPublishSchedule(
  schedule: PublishSchedule,
  now = new Date(),
): boolean {
  const { dayOfWeek } = getKstDateParts(now);

  switch (schedule) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekly':
      return dayOfWeek === 1;
    default:
      return false;
  }
}

export function getKstTimeLabel(now = new Date()): string {
  return getKstDateParts(now).timeLabel;
}
