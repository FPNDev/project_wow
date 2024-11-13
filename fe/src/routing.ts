import { setupRouter } from './local_modules/router/setup';
import { Start } from './page/Start';
import { Thread } from './page/Thread';

const routes = {
  start: {
    path: '/',
    component: Start,
  },
  thread: {
    path: /\/thread\/([\w_]+)(?:\/(\d+))?/,
    component: Thread,
  },
} as const;

const router = setupRouter(
  document.querySelector<HTMLButtonElement>('#app')!,
  Object.values(routes),
);

export { router, routes };
