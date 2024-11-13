import fsp from 'fs/promises';
import { RequestHandler } from 'express';

const convertFilesToPDFMiddleware: RequestHandler = async (req, _, next) => {
  await Promise.allSettled(
    (<Express.Multer.File[]>req.files).map((f) => fsp.unlink(f.path))
  );
  next();
};

export { convertFilesToPDFMiddleware };
