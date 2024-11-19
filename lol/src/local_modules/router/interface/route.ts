import { Component } from '../../component/component';

interface BaseRoute {
  path: string | RegExp;
  guard?: () => Promise<boolean> | boolean;
  guardChildren?: () => Promise<boolean> | boolean;
}

export interface RouteWithComponent extends BaseRoute {
  component: string | { new (): Component };
  children?: never;
}

export interface RouteWithChildren extends BaseRoute {
  children: readonly Route[];
  component?: never;
}

export type Route = RouteWithComponent | RouteWithChildren;
