/**
 * src/api/apiClient.ts
 * 
 * CORE UTILITY: Base Fetch Wrapper
 * 
 * This file provides the lowest-level HTTP request abstraction (`apiFetch`) used by 
 * all specific endpoints in `api/index.ts`. It standardizes error handling, JSON parsing, 
 * and header injection across the entire application.
 * 
 * Why this code/type is used:
 * - Native `fetch` API: Modern browser standard for HTTP requests, avoiding heavy dependencies like Axios.
 * - TypeScript Generics (`<T>`): Ensures the raw JSON parsed from the network is strongly typed upon return to the caller.
 */

// Define the root URL for the backend server. 
// Typically this is drawn from env variables in production (e.g., import.meta.env.VITE_API_URL).
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * apiFetch: A generic async wrapper over the native fetch API.
 * Automatically prepends the base URL, sets JSON headers, and handles HTTP error statuses.
 * 
 * @param endpoint The API route path (e.g., '/users')
 * @param options Standard fetch configuration object (method, body, custom headers)
 * @returns A promise resolving to the expected generic type T
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  // If we wanted JWT auth, we'd grab it here
  // const stateStr = localStorage.getItem('bugtracker_ai_state');
  // if (stateStr) {
  //   const state = JSON.parse(stateStr);
  //   if (state.session) {
  //       headers.set('Authorization', `Bearer ${state.session}`);
  //   }
  // }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Await network response
  const response = await fetch(url, config);

  // Centralized Error Handling boundary
  // If the HTTP status code is outside the 200-299 success range:
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      // Attempt to parse a structured error message sent by the Express backend
      const parsed = JSON.parse(errorBody);
      if (parsed.error) errorMessage = parsed.error;
    } catch {
      // If parsing fails, fall back to the generic HTTP status message
    }
    // Throw standard Error object so try/catch blocks in the UI can catch it cleanly
    throw new Error(errorMessage);
  }

  // Not all responses will have body (e.g. 204 No Content), but our backend mostly returns JSON
  const responseData = await response.text();
  return (responseData ? JSON.parse(responseData) : null) as T;
}
