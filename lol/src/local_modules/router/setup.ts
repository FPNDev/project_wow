import escapeStringRegexp from 'escape-string-regexp';
import {
  hasCompiledPathForRoute,
  Route,
  RouteWithCompiledPath,
  RouteWithComponent,
} from './interface/route';
import { Component } from '../component/component';

function findLocation(routes: (Route | RouteWithCompiledPath)[]) {
  const path = location.pathname;

  async function checkPath(
    routes: readonly (Route | RouteWithCompiledPath)[],
    pathPart: string | RegExp = ''
  ): Promise<[RouteWithComponent, RegExpMatchArray | null] | undefined> {
    for (const route of routes) {
      let fullPath: string | RegExp;

      let routeMatches = false;
      let fullMatch = false;
      let regExpMatch = null;

      const isNewPathString = typeof route.path === 'string';
      const isOldPathString = typeof pathPart === 'string';
      const isCompiled = hasCompiledPathForRoute(route);

      if (isNewPathString && isOldPathString) {
        if (!isCompiled) {
          (<RouteWithCompiledPath>route).compiledPath = pathPart + route.path;
        }
        fullPath = (<RouteWithCompiledPath>route).compiledPath;
        routeMatches = path.startsWith(<string>fullPath);
        fullMatch =
          routeMatches && (fullPath === path || fullPath + '/' === path);
      } else {
        if (!isCompiled) {
          let source = '';

          source += isOldPathString
            ? escapeStringRegexp(<string>pathPart)
            : (<RegExp>pathPart).source;
          source += isNewPathString
            ? escapeStringRegexp(<string>route.path)
            : (<RegExp>route.path).source;

          (<RouteWithCompiledPath>route).compiledPath = new RegExp(
            '^' + source + '/?'
          );
        }

        fullPath = (<RouteWithCompiledPath>route).compiledPath;

        regExpMatch = path.match(fullPath);
        routeMatches = !!regExpMatch;
        fullMatch = routeMatches && regExpMatch![0] === path;
      }

      if (!routeMatches) {
        continue;
      }

      const guardChildren =
        (!route.children?.length && !fullMatch) ||
        !route.guardChildren ||
        route.guardChildren(regExpMatch);
      if (
        (guardChildren instanceof Promise && !(await guardChildren)) ||
        !guardChildren
      ) {
        continue;
      }

      if (fullMatch) {
        const guard = !route.guard || route.guard(regExpMatch);
        if ((guard instanceof Promise && !(await guard)) || !guard) {
          continue;
        }

        if ('component' in route && route.component) {
          return [route, regExpMatch];
        }
      } else if ('children' in route && route.children?.length) {
        const match = await checkPath(route.children, fullPath!);
        if (match) {
          return match;
        }
      }
    }
  }

  return checkPath(routes).then((routeMatch) => {
    if (!routeMatch) {
      throw new Error('path not found');
    }

    return routeMatch;
  });
}

function render(
  element: Element,
  route: RouteWithComponent,
  activeRender?: Component
) {
  if (typeof route.component === 'string') {
    if (activeRender) {
      activeRender?.destroy();
    }
    element.replaceChildren(route.component);
  } else if (!activeRender || activeRender?.constructor !== route.component) {
    if (activeRender) {
      activeRender?.destroy();
    }

    const instance = new route.component();
    element.replaceChildren(instance.createView());

    return instance;
  } else {
    return activeRender;
  }
}
export type RouteUpdateEvent = Event & {
  detail?: {
    previousPath: RouteWithComponent;
    currentPath: RouteWithComponent;
    previousLocation: Location;
    currentLocation: Location;
  };
};

export function setupRouter(element: Element, routes: Route[]) {
  let previousLocation: Location | undefined;
  let queuedPromise: Promise<
    [RouteWithComponent, RegExpMatchArray | null]
  > | void;

  let activeLocation: Location;
  let activePath: RouteWithComponent;
  let activeRender: Component | undefined;
  let routeParams: Readonly<RegExpMatchArray> | null;

  const runNavigation = async () => {
    if (
      !previousLocation ||
      !activeLocation ||
      previousLocation.href !== activeLocation.href
    ) {
      const currentPromise = (queuedPromise = findLocation(routes));
      const [foundLocation, matchedParams] = await currentPromise;

      if (foundLocation && currentPromise === queuedPromise) {
        const previousPath = activePath;
        previousLocation = activeLocation;

        activeLocation = {
          href: location.href,
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          origin: location.origin,
          protocol: location.protocol,
          host: location.host,
          hostname: location.hostname,
          port: location.port,
        } as Location;
        activePath = foundLocation;
        routeParams = Object.freeze(matchedParams);

        const newRender = render(element, activePath, activeRender);
        const reusingInstance =
          newRender instanceof Component && newRender === activeRender;

        activeRender = newRender;

        if (previousPath && reusingInstance) {
          window.dispatchEvent(
            new CustomEvent<RouteUpdateEvent['detail']>('routeUpdate', {
              detail: {
                previousPath,
                currentPath: activePath,
                previousLocation,
                currentLocation: activeLocation,
              },
            })
          );
        }
      }
    }
  };

  window.addEventListener('popstate', runNavigation);
  runNavigation();

  return {
    go(url: string) {
      history.pushState(null, '', url);
      return runNavigation();
    },
    getQueryParams() {
      return routeParams;
    },
  };
}
