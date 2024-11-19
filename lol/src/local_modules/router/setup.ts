import escapeStringRegexp from 'escape-string-regexp';
import { Route, RouteWithComponent } from './interface/route';
import { Component } from '../component/component';

const findLocation = (routes: Route[]) => {
  const path = location.pathname;

  const checkPath = async (
    routes: readonly Route[],
    pathPart: string | RegExp = '',
  ): Promise<RouteWithComponent> => {
    for (let route of routes) {
      let fullPath: string | RegExp;

      let routeMatches = false;
      let fullMatch = false;

      const isNewPathString = typeof route.path === 'string';
      const isOldPathString = typeof pathPart === 'string';

      if (isNewPathString && isOldPathString) {
        fullPath = pathPart + route.path;
        routeMatches = path.startsWith(fullPath);
        fullMatch =
          routeMatches && (fullPath === path || fullPath + '/' === path);
      } else {
        let source = '';

        source += isNewPathString
          ? escapeStringRegexp(<string>route.path)
          : (<RegExp>route.path).source;
        source += isOldPathString
          ? escapeStringRegexp(<string>pathPart)
          : (<RegExp>pathPart).source;

        fullPath = new RegExp('^' + source + '/?');

        const match = path.match(fullPath);
        routeMatches = !!match;
        fullMatch = routeMatches && match![0] === path;
      }

      if (!routeMatches) {
        continue;
      }

      const guardChildren =
        (!route.children?.length && !fullMatch) ||
        !route.guardChildren ||
        route.guardChildren();
      if (
        (guardChildren instanceof Promise && !(await guardChildren)) ||
        !guardChildren
      ) {
        continue;
      }

      if (fullMatch) {
        const guard = !route.guard || route.guard();
        if ((guard instanceof Promise && !(await guard)) || !guard) {
          continue;
        }

        if ('component' in route && route.component) {
          return route;
        }
      } else if ('children' in route && route.children?.length) {
        const match = checkPath(route.children, fullPath!);
        if (match) {
          return match;
        }
      }
    }

    throw new Error('path not found');
  };

  return checkPath(routes);
};

const render = (
  element: Element,
  route: RouteWithComponent,
  activeRender?: Component,
) => {
  if (typeof route.component === 'string') {
    activeRender?.destroy();
    element.innerHTML = route.component;
  } else if (activeRender?.constructor !== route.component) {
    activeRender?.destroy();
    element.innerHTML = '';

    const instance = new route.component();
    element.appendChild(instance.node);

    return instance;
  } else if (activeRender) {
    return activeRender;
  }
};

export const setupRouter = (element: Element, routes: Route[]) => {
  let loc: Location;
  let queuedPromise: Promise<Route> | void;

  let activeLocation: Location;
  let activePath: RouteWithComponent;
  let activeRender: Component | undefined;

  const runNavigation = async () => {
    const oldLoc = loc;
    loc = { ...location };
    if (oldLoc?.href !== loc?.href) {
      const currentPromise = (queuedPromise = findLocation(routes));
      const foundLocation = await findLocation(routes);

      if (foundLocation && currentPromise === queuedPromise) {
        const previousPath = activePath;
        const previousLocation = activeLocation;

        activeLocation = loc;
        activePath = foundLocation;
        activeRender = render(element, activePath, activeRender);

        if (previousPath) {
          window.dispatchEvent(
            new CustomEvent('routeChange', {
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
    go: (url: string) => {
      history.pushState(null, '', url);
      runNavigation();
    },
  };
};
