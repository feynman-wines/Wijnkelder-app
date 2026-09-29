/**
 * Resolves API endpoints whether running locally, on AI Studio, or deployed to GitHub Pages.
 */
const CLOUD_BACKEND_URL = 'https://ais-dev-sbc65llrmjhuxiyzbd4yve-293151906901.europe-west2.run.app';

export async function callBackendApi(endpoint: string, options: RequestInit): Promise<Response> {
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  // If on GitHub Pages, directly use the Cloud Backend URL
  if (isGitHubPages) {
    const fullUrl = `${CLOUD_BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    return fetch(fullUrl, options);
  }

  // Otherwise, try local/relative endpoint first
  try {
    const localRes = await fetch(endpoint, options);
    if (localRes.ok || localRes.status !== 404) {
      return localRes;
    }
  } catch (localErr) {
    console.warn('Local endpoint failed, trying cloud backend fallback:', localErr);
  }

  // Fallback to Cloud Backend
  const fallbackUrl = `${CLOUD_BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  return fetch(fallbackUrl, options);
}
