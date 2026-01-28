/**
 * Centralized app configuration
 * 
 * Use PUBLISHED_URL for all shareable links (invite codes, referrals, etc.)
 * to ensure links always point to the production domain regardless of
 * which environment generated them.
 */

export const PUBLISHED_URL = 'https://openclique.lovable.app';

/**
 * Get a full URL for a given path using the production domain
 */
export function getPublishedUrl(path: string): string {
  return `${PUBLISHED_URL}${path.startsWith('/') ? path : '/' + path}`;
}
