import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripLeadingHeaders(text: string): string {
  return text
    // Remove markdown headers
    .replace(/^#{1,6}\s+.*$/gm, "")
    // Remove numbered section titles
    .replace(/^\d+\.\s+.*$/gm, "")
    // Remove title-like first line if it's short and capitalized
    .replace(/^[A-Z][A-Za-z\s]{10,60}$/m, "")
    .trim();
}
