import bodyParser from 'body-parser';
import { app } from '../../express';
import { LoadedQuestionsByThread, setThreadTopic } from '../../learnGPT';

app.post('/:threadId/topic', bodyParser.json(), async (req, res) => {
  const threadId = req.params.threadId;
  const topic: unknown = req.body.topic;

  if (!threadId || typeof topic !== 'string') {
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
