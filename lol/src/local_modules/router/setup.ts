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
    pathPart: string | RegExp = '',
  ): Promise<[RouteWithComponent, RegExpMatchArray | null]> {
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
            '^' + source + '/?',
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
        const match = checkPath(route.children, fullPath!);
        if (match) {
          return match;
        }
      }
    }

    throw new Error('path not found');
  }

  return checkPath(routes);
}

function render(
  element: Element,
  route: RouteWithComponent,
  activeRender?: Component,
) {
  if (typeof route.component === 'string') {
    activeRender?.destroy();
    element.innerHTML = route.component;
  } else if (activeRender?.constructor !== route.component) {
    activeRender?.destroy();
    element.innerHTML = '';

    const instance = new route.component();
    element.appendChild(instance.createView());

    return instance;
  } else if (activeRender) {
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
  let loc: Location;
  let queuedPromise: Promise<
    [RouteWithComponent, RegExpMatchArray | null]
  > | void;

  let activeLocation: Location;
  let activePath: RouteWithComponent;
  let activeRender: Component | undefined;
  let routeParams: Readonly<RegExpMatchArray> | null;

  const runNavigation = async () => {
    const oldLoc = loc;
    loc = { ...location };
    if (oldLoc?.href !== loc?.href) {
      const currentPromise = (queuedPromise = findLocation(routes));
      const [foundLocation, matchedParams] = await currentPromise;

      if (foundLocation && currentPromise === queuedPromise) {
        const previousPath = activePath;
        const previousLocation = activeLocation;

        activeLocation = loc;
        activePath = foundLocation;
        routeParams = Object.freeze(matchedParams);

        const newRender = render(element, activePath, activeRender);
        const reusingInstance = newRender === activeRender;

        activeRender = newRender;

        if (reusingInstance) {
          window.dispatchEvent(
            new CustomEvent<RouteUpdateEvent['detail']>('routeUpdate', {
              detail: {
                previousPath,
                currentPath: activePath,
                previousLocation,
                currentLocation: activeLocation,
              },
            }),
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
