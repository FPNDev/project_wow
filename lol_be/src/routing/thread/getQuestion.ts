import { RequestHandler } from 'express';
import { app } from '../../express';
import { doesThreadExist, getQuestion, Question } from '../../learnGPT';

const getQuestionAction: RequestHandler = async (req, res) => {
  const threadId: string = req.params.threadId;
  const questionId: number = +req.params.questionId;

  if (!threadId || !(await doesThreadExist(threadId))) {
    res.status(404).send('thread does not exist');
    return;
  }

  let question!: Question;
  try {
    question = await getQuestion(
      threadId,
      isNaN(questionId) || !isFinite(questionId) ? undefined : questionId
    );
  } catch (e: unknown) {
    res.status(404).send((<Error>e).message);
    return;
  }

  res.send(question);
};

app.get('/:threadId/question', getQuestionAction);
app.get('/:threadId/question/:questionId', getQuestionAction);
