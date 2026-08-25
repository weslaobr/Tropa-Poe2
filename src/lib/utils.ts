import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

const numberFormatter = new Intl.NumberFormat('pt-BR');

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
