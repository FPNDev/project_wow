import { app } from './express';
import './routing';

app.listen(151, '0.0.0.0', () => {
  console.log('api started');
});
