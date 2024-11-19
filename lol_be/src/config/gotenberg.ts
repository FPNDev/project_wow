import { convert, gotenberg, html, pipe, please } from 'gotenberg-js-client';

const toPDF = pipe(gotenberg('http://localhost:3000'), convert, html, please);
