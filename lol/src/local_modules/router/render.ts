import { Component } from '../component/component';
import { RouteWithComponent } from './interface/route';

export function render(
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
    element.replaceChildren(instance.ensureView());

    return instance;
  } else {
    return activeRender;
  }
}
