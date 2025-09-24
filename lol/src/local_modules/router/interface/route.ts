import { Component } from '../../component/component';

type BaseRoute = {
  path: string | RegExp;
  guard?(queryParams: RegExpMatchArray | null):  Promise<unknown> | unknown;
  guardChildren?(queryParams: RegExpMatchArray | null): Promise<unknown> | unknown;
};

export type RouteWithComponent = BaseRoute & {
  component: string | { new (): Component };
  children?: RouteWithChildren['children'];
};

export type RouteWithComponentOnly = RouteWithComponent & {
  children?: never;
};

export type RouteWithChildren = BaseRoute & {
  children: readonly Route[];
  component?: never;
};
export type FullRoute = BaseRoute & {
  children: RouteWithChildren['children'];
  component: RouteWithComponent['component'];
};

export type Route = RouteWithComponentOnly | RouteWithChildren | FullRoute;
export type RouteWithCompiledPath = Route & {
  compiledPath: string | RegExp;
};

export function hasCompiledPathForRoute(r: Route): r is RouteWithCompiledPath {
  return 'compiledPath' in r;
}
