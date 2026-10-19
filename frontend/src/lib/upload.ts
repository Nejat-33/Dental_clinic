import { api } from '@/lib/api';

/** Best effort: removes an image we uploaded to Cloudinary. Failures are ignored,
 *  e.g. seed images that aren't ours are refused by the API, which is fine. */
export function discardUpload(url: string | null | undefined) {
  if (!url) return;
  api('/upload', { method: 'DELETE', body: JSON.stringify({ url }) }).catch(() => {});
}