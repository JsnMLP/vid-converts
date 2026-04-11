// ============================================================
// File: src/hooks/useResourceValidator.ts
// PURPOSE: Client-side hook used in ReportClient.tsx
//          - Validates each resource link (YouTube oembed, Vimeo oembed)
//          - Silently hides dead links from subscribers
//          - Pings /api/admin/dead-link to alert you by email
//          - All of this happens invisibly in the background
// ============================================================

import { useEffect, useState } from 'react';
import { Resource } from '@/lib/resourcePool';

interface ValidatorState {
  [resourceId: string]: 'pending' | 'live' | 'dead';
}

export function useResourceValidator(
  resources: Resource[],
  reportId: string
): ValidatorState {
  const [state, setState] = useState<ValidatorState>(() => {
    // All start as pending
    const initial: ValidatorState = {};
    resources.forEach((r) => {
      initial[r.id] = 'pending';
    });
    return initial;
  });

  useEffect(() => {
    if (resources.length === 0) return;

    resources.forEach((resource) => {
      checkResource(resource, reportId, setState);
    });
  }, [resources.map((r) => r.id).join(',')]);

  return state;
}

async function checkResource(
  resource: Resource,
  reportId: string,
  setState: React.Dispatch<React.SetStateAction<ValidatorState>>
) {
  let isLive = false;

  try {
    if (resource.platform === 'youtube') {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(resource.url)}&format=json`;
      const res = await fetch(oembedUrl, { method: 'GET' });
      isLive = res.ok;
    } else if (resource.platform === 'vimeo') {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(resource.url)}`;
      const res = await fetch(oembedUrl, { method: 'GET' });
      isLive = res.ok;
    } else {
      // TikTok and Instagram have no public oembed — assume live
      isLive = true;
    }
  } catch {
    isLive = false;
  }

  setState((prev) => ({
    ...prev,
    [resource.id]: isLive ? 'live' : 'dead',
  }));

  // If dead, silently ping admin alert (fire and forget)
  if (!isLive) {
    try {
      fetch('/api/admin/dead-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: resource.id,
          url: resource.url,
          category: resource.category,
          reportId,
        }),
      }).catch(() => {}); // truly fire-and-forget
    } catch {
      // ignore
    }
  }
}

// ── Usage in ReportClient.tsx ─────────────────────────────
//
// import { useResourceValidator } from '@/hooks/useResourceValidator';
// import { getResourcesForCategory } from '@/lib/resourcePool';
//
// // Inside your component, for each rubric category:
// const hookResources = getResourcesForCategory('hook', report.id, 3);
// const validatorState = useResourceValidator(
//   [...hookResources, ...ctaResources, ...trustResources, ...],
//   report.id
// );
//
// // When rendering each resource link:
// {hookResources.map((resource) => {
//   const status = validatorState[resource.id];
//   if (status === 'dead') return null; // silently hidden
//   if (status === 'pending') {
//     // Render a subtle skeleton/placeholder while checking
//     return (
//       <div key={resource.id} style={{ opacity: 0.4, height: '60px' }} />
//     );
//   }
//   // status === 'live' — render normally
//   return (
//     <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer">
//       🧠 {resource.title} — {resource.creator}
//     </a>
//   );
// })}
