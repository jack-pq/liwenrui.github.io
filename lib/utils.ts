import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(ts: number | string | Date): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function formatDateTime(ts: number | string | Date): string {
  const d = new Date(ts);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

export function toFeishuDate(d: Date): number {
  return d.getTime();
}

export function fromFeishuDate(ts: number): Date {
  return new Date(ts);
}

export function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function monthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = todayStart();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

export function dateKey(d: Date): string {
  return formatDate(d);
}

export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = 0; j < window; j++) sum += values[i - j];
    return sum / window;
  });
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export const HABIT_COLORS = [
  "#527552",
  "#a87f50",
  "#7d7560",
  "#9fbc9f",
  "#d4bd9d",
  "#5f5947",
  "#bf9d72",
  "#3f5d3f",
];

export function pickColor(i: number): string {
  return HABIT_COLORS[i % HABIT_COLORS.length];
}
