import escapeStringRegexp from 'escape-string-regexp';
import {
  hasCompiledPathForRoute,
  Route,
  RouteWithCompiledPath,
  RouteWithComponent,
} from './interface/route';

function compilePath(route: Route, pathPrefix: string | RegExp): void {
  const newRoute = route as RouteWithCompiledPath;

  const prefixIsString = typeof pathPrefix === 'string';
  const routePathIsString = typeof route.path === 'string';

  if (prefixIsString && routePathIsString) {
    let pathSuffix = <string>route.path;
    const suffixStartsWithSlash = pathSuffix[0] === '/';
    const prefixEndsWithSlash = pathPrefix.endsWith('/');
    if (suffixStartsWithSlash && prefixEndsWithSlash) {
      pathSuffix = pathSuffix.slice(1);
    } else if (!suffixStartsWithSlash && !prefixEndsWithSlash) {
      pathSuffix = '/' + pathSuffix;
    }

    newRoute.compiledPath = pathPrefix + pathSuffix;
  } else {
    let source = '';

    source += prefixIsString
      ? escapeStringRegexp(<string>pathPrefix)
      : (<RegExp>pathPrefix).source;
    source += routePathIsString
      ? escapeStringRegexp(<string>route.path)
      : (<RegExp>route.path).source;

    newRoute.compiledPath = new RegExp('^' + source + '/?');
  }
}

export function findLocation(
  routes: (Route | RouteWithCompiledPath)[],
  path: string
) {
  async function checkPath(
    routes: readonly (Route | RouteWithCompiledPath)[],
    pathPrefix: string | RegExp = ''
  ): Promise<[RouteWithComponent, RegExpMatchArray | null] | undefined> {
    for (const route of routes) {
      let routeMatches = false;
      let fullMatch = false;
      let regExpMatch = null;

      if (!hasCompiledPathForRoute(route)) {
        compilePath(route, pathPrefix);
      }

      const fullPath = (<RouteWithCompiledPath>route).compiledPath;
      if (typeof fullPath === 'string') {
        routeMatches = path.startsWith(<string>fullPath);
        fullMatch =
          routeMatches && (fullPath === path || fullPath + '/' === path);
      } else {
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
