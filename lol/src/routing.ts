import { Route } from './local_modules/router/interface/route';
import { setupRouter } from './local_modules/router/setup';
import { Start } from './page/Start';
import { Thread } from './page/Thread';

const StartRoute = {
  path: '/',
  component: Start,
};
const ThreadRoute = {
  path: /\/thread\/([\w_]+)(?:\/(\d+))?/,
  component: Thread,
};

const routes: Route[] = [
  StartRoute, // path: /
  ThreadRoute, // path: /thread/:id(/:messageIndex)
] as const;

const router = setupRouter(
  document.querySelector<HTMLButtonElement>('#app')!,
  routes,
);

export { router };
