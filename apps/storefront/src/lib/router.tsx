
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
  FC,
  ReactNode,
} from 'react';

// --- Helper Function ---
/**
 * Matches a route path against a URL path and extracts parameters.
 */
function matchPath(
  routePath: string,
  urlPath: string
): { match: boolean; params: Record<string, string> } {
  const routeParts = routePath.split('/').filter(Boolean);
  const urlParts = urlPath.split('/').filter(Boolean);

  if (routeParts.length !== urlParts.length) {
    return { match: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1);
      params[paramName] = urlParts[i];
    } else if (routeParts[i] !== urlParts[i]) {
      return { match: false, params: {} };
    }
  }

  return { match: true, params };
}

// --- Contexts ---
interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
  query: URLSearchParams;
}

const RouterContext = createContext<RouterContextValue | null>(null);
const RouteParamsContext = createContext<Record<string, string>>({});

// --- Hooks ---
/**
 * Custom hook to access router context (path, navigation, params, query).
 */
export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a <Router>');
  }
  const params = useContext(RouteParamsContext);
  return { ...context, params };
}

// --- Components ---

/**
 * Provides routing context to its children. Listens to URL changes.
 */
export function Router({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);
  const [search, setSearch] = useState(window.location.search);

  useEffect(() => {
    const onLocationChange = () => {
      setPath(window.location.pathname);
      setSearch(window.location.search);
    };
    window.addEventListener('popstate', onLocationChange);
    window.addEventListener('pushstate', onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('pushstate', onLocationChange);
    };
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new Event('pushstate'));
  };

  const query = useMemo(() => new URLSearchParams(search), [search]);

  return (
    <RouterContext.Provider value={{ path, navigate, query }}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * Renders the first matching <Route> child.
 */
export function Routes({ children }: { children: ReactNode }) {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('Routes must be used within a Router');
  }

  let matchedElement: React.ReactElement | null = null;
  let matchedParams: Record<string, string> = {};

  React.Children.forEach(children, (child) => {
    if (matchedElement) return;
    if (React.isValidElement(child) && child.type === Route) {
      const { match, params } = matchPath(child.props.path, context.path);
      if (match) {
        const Component = child.props.component;
        matchedElement = <Component />;
        matchedParams = params;
      }
    }
  });

  return (
    <RouteParamsContext.Provider value={matchedParams}>
      {matchedElement}
    </RouteParamsContext.Provider>
  );
}

interface RouteProps {
  path: string;
  component: FC;
}

/**
 * A configuration component that defines a route. Does not render anything itself.
 */
export function Route({ }: RouteProps) {
  return null;
}