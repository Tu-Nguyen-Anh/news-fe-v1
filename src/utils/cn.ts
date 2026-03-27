import { type ClassValue, clsx } from "clsx";

/** Merge class names, filtering out falsy values. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
