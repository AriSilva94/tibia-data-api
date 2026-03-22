import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function utcNow(): dayjs.Dayjs {
  return dayjs.utc();
}

export function startOfDay(date?: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs.utc(date).startOf('day');
}

export function endOfDay(date?: dayjs.ConfigType): dayjs.Dayjs {
  return dayjs.utc(date).endOf('day');
}

export function toISOString(date?: dayjs.ConfigType): string {
  return dayjs.utc(date).toISOString();
}

export function formatDate(
  date: dayjs.ConfigType,
  format = 'YYYY-MM-DD',
): string {
  return dayjs.utc(date).format(format);
}

export function todayString(): string {
  return formatDate(dayjs.utc());
}

export function isStale(lastCollectedAt: Date | null, thresholdMinutes: number): boolean {
  if (!lastCollectedAt) return true;
  return dayjs.utc().diff(dayjs.utc(lastCollectedAt), 'minute') > thresholdMinutes;
}
