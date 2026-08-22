import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const statusColor: Record<string, string> = {
  active: '#22c55e',
  'at-risk': '#f59e0b',
  blocked: '#ef4444',
  completed: '#64748b',
  todo: '#64748b',
  'in-progress': '#06b6d4',
  done: '#22c55e',
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
}

export const statusLabel: Record<string, string> = {
  active: 'Active',
  'at-risk': 'At Risk',
  blocked: 'Blocked',
  completed: 'Completed',
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}
