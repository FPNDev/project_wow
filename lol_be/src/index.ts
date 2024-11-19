import { app } from './express';
import './routing';

import { implementation } from 'jsdom/lib/jsdom/living/nodes/HTMLStyleElement-impl.js';

implementation.prototype._updateAStyleBlock = () => {};

app.listen(151, '0.0.0.0', () => {
  console.log('api started');
});
