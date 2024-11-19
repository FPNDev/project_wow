import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (_, file, cb) {
    cb(null, Math.random().toString(32).slice(2) + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });