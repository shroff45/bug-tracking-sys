/**
 * src/env.d.ts
 * 
 * CONFIGURATION: Vite Environment Variables Typings
 * 
 * This file augments the global JavaScript `import.meta` object to provide strict TypeScript 
 * definitions for environment variables loaded by Vite (from `.env` files).
 * 
 * Why this code/type is used:
 * - By declaring the shape of `ImportMetaEnv`, we ensure developers get auto-completion 
 *   and compile-time safety when accessing properties like `import.meta.env.VITE_GOOGLE_CLIENT_ID`, 
 *   preventing silent typos.
 */

/// <reference types="vite/client" /> // Instructs TS compiler to include base Vite types

// Define custom environment variables starting with "VITE_"
interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string
    // more env variables...
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
