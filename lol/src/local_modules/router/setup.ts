import { Route, RouteWithComponent } from './interface/route';
import { Component } from '../component/component';
import { render } from './render';
import { findLocation } from './paths';

export type RouteUpdateEvent = CustomEvent<{
  previousPath: RouteWithComponent;
  currentPath: RouteWithComponent;
  previousLocation: Location;
  currentLocation: Location;
}>;

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
      const currentPromise = (queuedPromise = findLocation(
        routes,
        location.pathname,
      ));
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
        routeParams = matchedParams && Object.freeze(matchedParams);

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
