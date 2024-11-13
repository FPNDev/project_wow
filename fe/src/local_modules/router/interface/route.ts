import { Component } from '../../component/component';

interface BaseRoute {
  path: string | RegExp;
}

export interface RouteWithComponent extends BaseRoute {
  component: string | { new (): Component };
  children?: Route[];
}

export interface RouteWithChildren extends BaseRoute {
  children: Route[];
}

export type Route = RouteWithComponent | RouteWithChildren;
