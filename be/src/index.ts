import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';

import {
  createThread,
  doesThreadExist,
  getQuestion,
  LoadedQuestionsByThread,
  Question,
  setThreadTopic,
} from './learnGPT';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (_, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

const app = express();

app.use(cors());

type NextRoute = 'route' | 'router';

app.post('/create', async (req, res) => {
  upload.array('files[]')(req, res, async (uploadError?: multer.MulterError | NextRoute) => {
    if (uploadError) {
      res.writeHead(404);
      res.end();
      return;
    }

    const text = req.body.text as string;

    if (!text) {
      res.writeHead(404);
      res.end();
      return;
    }

    try {
      res.send({ ok: true, threadId: await createThread(text, []) });
    } catch (e) {
      res.send({ ok: false, errorMessage: (e as Error).message });
    }
  });
});

app.post('/topic', bodyParser.json(), async (req, res) => {
  const threadId = req.body.threadId as string;
  const topic = req.body.topic as string | undefined;

  if (!threadId) {
    res.writeHead(404);
    res.end();
    return;
  }

  try {
    await setThreadTopic(threadId, topic);
    res.send({
      ok: true,
      startsAt: LoadedQuestionsByThread[threadId]?.length ?? 0,
    });
  } catch (e) {
    res.send({ ok: false, errorMessage: (e as Error).message });
  }
});

const qIdx: Record<string, number> = {};
app.get('/question', bodyParser.json(), async (req, res) => {
  const threadId = req.query.threadId as string;
  const questionId = req.query.questionId as string | void;

  if (!threadId || !(await doesThreadExist(threadId))) {
    res.writeHead(404);
    res.end();
    return;
  }

  qIdx[threadId] ||= 0;
  let question!: Question;
  try {
    question = await getQuestion(
      threadId,
      questionId !== undefined ? +questionId : qIdx[threadId]++
    );
  } catch (e: unknown) {
    res.status(404).send((<Error>e).message);
    return;
  }

  res.send(question);
});

app.listen(151, '0.0.0.0', () => {
  console.log('api started');
});
