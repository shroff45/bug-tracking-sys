/**
 * src/utils/cn.ts
 * 
 * UTILITY: Tailwind CSS Class Merger
 * 
 * Provides a reliable function to merge raw Tailwind CSS class strings and resolve conflicts safely.
 * Widely used in modern React ecosystems constructed with tools like Shadcn UI.
 * 
 * Why this code/type is used:
 * - `clsx`: Conditionally constructs string lists (e.g., dynamically adding classes based on state).
 * - `twMerge`: Intelligently resolves Tailwind syntax conflicts (e.g., if you pass both `p-4` and `p-8`, it explicitly strips `p-4` rather than letting the browser cascade guess).
 */
import { clsx, type ClassValue } from "clsx"; // Conditional class library
import { twMerge } from "tailwind-merge"; // Conflict resolution library

// Exposes `cn` everywhere as a concise merging tag
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
