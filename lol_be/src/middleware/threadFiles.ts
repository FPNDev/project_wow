import multer from 'multer';
import fsp from 'fs/promises';
import { RequestHandler } from 'express';
import { upload } from '../config/multer';
import { NextRoute } from '../express';

const uploadThreadFiles: RequestHandler = (req, res, next) => {
  return upload.array('files[]')(
    req,
    res,
    (uploadError?: multer.MulterError | NextRoute) => {
      if (uploadError) {
        res.writeHead(404);
        res.end();
        return; 
      }

      next();
    }
  );
};

const deleteThreadFiles: RequestHandler = async (req, _, next) => {
  await Promise.allSettled(
    (<Express.Multer.File[]>req.files).map((f) => fsp.unlink(f.path))
  );
  next();
};

export { uploadThreadFiles, deleteThreadFiles };
