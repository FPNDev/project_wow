import { Route } from './interface/route';

export function aliasRoute(route: Route, alias: string | RegExp): Route {
  const newRoute = cloneRoute(route);
  newRoute.path = alias;

  return newRoute;
}

const cloneRoute = (route: Route): Route => {
  const newRoute: Partial<Route> = {
    path: route.path,
  };
  if ('component' in route) {
    newRoute.component = route.component;
  }
  if ('children' in route && route.children) {
    const children: Route[] = (newRoute.children = []);
    for (const child of route.children) {
      children.push(cloneRoute(child));
    }
  }

  return newRoute as Route;
};
