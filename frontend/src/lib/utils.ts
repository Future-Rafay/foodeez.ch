import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 
/** Restaurant links are often stored without a protocol ("www.pizza.ch"); without one the browser treats them as a Foodeez path. */
export function toExternalUrl(url: string | null | undefined) {
  const value = url?.trim();
  if (!value || value === "0" || value === "null") return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
