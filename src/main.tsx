/**
 * src/main.tsx
 * 
 * CORE ARCHITECTURE: Application Entry Point
 * 
 * This file is the primary bootstrap script for the React Vite application.
 * It mounts the React virtual DOM onto the physical HTML document.
 * 
 * Why this code/type is used:
 * - createRoot: React 18+ concurrent rendering API initialization.
 * - StrictMode: Development tool that double-invokes components to catch lifecycle bugs and anti-patterns early.
 * - index.css: Imports Tailwind directives globally before any components render.
 */
import { StrictMode } from "react"; // React strictly typing and dev checks
import { createRoot } from "react-dom/client"; // DOM rendering engine
import "./index.css"; // Global styles (Tailwind)
import { App } from "./App"; // Root application component

// Mount the App component onto the `<div id="root">` element existing in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
