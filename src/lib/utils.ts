import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  const ts = Date.now().toString(36).slice(-4);
  return `${prefix}-${ts}${rand}`;
}
