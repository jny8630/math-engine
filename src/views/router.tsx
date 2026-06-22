import { useEffect, useState } from 'preact/hooks';

// Strip the Vite base path so we get the "logical" route.
// In dev: base is '/math-engine/', so pathname is '/math-engine/' or '/math-engine/parents'
// We normalize to '/', '/parents', etc.
const BASE = '/math-engine';

export type Route =
  | { name: 'home' }
  | { name: 'sprint' }
  | { name: 'her-progress' }
  | { name: 'parents' }
  | { name: 'parents-report' }
  | { name: 'settings' };

function pathToRoute(pathname: string): Route {
  let p = pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  if (p === '' || p === '/') return { name: 'home' };
  if (p === '/sprint') return { name: 'sprint' };
  if (p === '/her-progress') return { name: 'her-progress' };
  if (p === '/parents') return { name: 'parents' };
  if (p === '/parents/report') return { name: 'parents-report' };
  if (p === '/settings') return { name: 'settings' };
  return { name: 'home' };
}

function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return `${BASE}/`;
    case 'sprint':
      return `${BASE}/sprint`;
    case 'her-progress':
      return `${BASE}/her-progress`;
    case 'parents':
      return `${BASE}/parents`;
    case 'parents-report':
      return `${BASE}/parents/report`;
    case 'settings':
      return `${BASE}/settings`;
  }
}

export function useRouter(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => pathToRoute(window.location.pathname));

  useEffect(() => {
    function onPopState() {
      setRoute(pathToRoute(window.location.pathname));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(next: Route) {
    const path = routeToPath(next);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoute(next);
  }

  return [route, navigate];
}
