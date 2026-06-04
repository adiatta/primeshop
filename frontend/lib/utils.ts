import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes sans conflits
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formater un prix
export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Formater une date
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(date));
}

// Calculer le pourcentage de réduction
export function discountPercent(original: number, sale: number): number {
  return Math.round((1 - sale / original) * 100);
}

// Tronquer un texte
export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// Générer un slug
export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Délai (pour les tests)
export function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}