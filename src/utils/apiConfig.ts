/**
 * Resolves API endpoints whether running locally, on AI Studio, Vercel, or deployed to GitHub Pages.
 */
const CLOUD_BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'https://ais-dev-h5ss3h7ydzx2gkp4euppqe-293151906901.europe-west2.run.app';

export async function callBackendApi(endpoint: string, options: RequestInit): Promise<Response> {
  const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

  // If on GitHub Pages and not custom domain with same-origin backend, use the Cloud Backend URL
  if (isGitHubPages) {
    const fullUrl = `${CLOUD_BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    return fetch(fullUrl, options);
  }

  // Otherwise, use relative endpoint (standard for same-origin, Vercel serverless, and AI Studio)
  try {
    const localRes = await fetch(endpoint, options);
    if (localRes.ok || (localRes.status !== 404 && localRes.status !== 502)) {
      return localRes;
    }
  } catch (localErr) {
    console.warn('Local endpoint failed, trying cloud backend fallback:', localErr);
  }

  // Fallback to Cloud Backend if local fails
  const fallbackUrl = `${CLOUD_BACKEND_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  return fetch(fallbackUrl, options);
}
