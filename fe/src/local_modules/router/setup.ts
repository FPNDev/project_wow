import escapeStringRegexp from 'escape-string-regexp';
import { Route, RouteWithComponent } from './interface/route';
import { Component } from '../component/component';

const findLocation = (routes: Route[]) => {
  const path = location.pathname;

  const checkPath = (
    routes: Route[],
    pathPart = '^',
    parents: Route[] = [],
  ): RouteWithComponent | undefined => {
    for (let route of routes) {
      const partRegexp =
        typeof route.path === 'string'
          ? escapeStringRegexp(route.path)
          : route.path.source;

      const fullPath = pathPart ? pathPart + partRegexp : partRegexp;

      const routeMatches = path.match(fullPath + '/?');
      if (!routeMatches) {
        continue;
      }

      const fullMatch = routeMatches[0] === path;
      if (fullMatch) {
        if ('component' in route && route.component) {
          return route;
        }
      } else if ('children' in route && route.children?.length) {
        const match = checkPath(route.children, fullPath, [route, ...parents]);
        if (match) {
          return match;
        }
      }
    }
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
  let activePath = findLocation(routes);
  let activeRender = activePath && render(element, activePath);

  const runNavigation = () => {
    const oldLoc = loc;
    loc = { ...location };
    if (oldLoc?.href !== loc?.href) {
      const foundLocation = findLocation(routes);
      if (foundLocation) {
        const previousPath = activePath;

        activePath = foundLocation;
        activeRender = render(element, activePath, activeRender);

        window.dispatchEvent(
          new CustomEvent('routeChange', {
            detail: {
              previousPath,
              currentPath: activePath,
              previousLocation: oldLoc,
              currentLocation: loc,
            },
          }),
        );
      }
    }
  };

  window.addEventListener('popstate', runNavigation);

  return {
    go: (url: string) => {
      history.pushState(null, '', url);
      runNavigation();
    },
  };
};
