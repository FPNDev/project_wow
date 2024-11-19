import { app } from '../../express';
import { createThread } from '../../learnGPT';
import middleware from '../../middleware';

app.post('/create', middleware.uploadThreadFiles, async (req, res) => {
  const text = req.body.text as string;
  const files = (req.files ?? []) as Express.Multer.File[];

  if (!text && !files.length) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    res.send({ ok: true, threadId: await createThread(text, files) });
  } catch (e) {
    res.send({ ok: false, errorMessage: (e as Error).message });
  }
});
