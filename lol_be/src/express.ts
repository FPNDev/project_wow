import express from 'express';
import cors from 'cors';

type NextRoute = 'route' | 'router';

const app = express();
app.use(cors());

export { app };
export type { NextRoute };
