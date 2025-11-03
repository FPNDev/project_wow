import { sendMessageReceiveDelta } from '../gpt';
import { of } from '../observable/util';
import { removeResponseEnd } from './response';
import { markThreadActive } from './threads';

export type Question = {
  question: string;
  answers: string[];
  quote: string;
};

const PRELOAD_BEFORE = 10;

const SUCCESS_TOKEN = '[success]';
const ERROR_TOKEN = '[error]';
const ANSWER_TOKEN = '[answer]';
const QUOTE_TOKEN = '[quote]';
const QUESTION_START_TOKEN = '[question]';
const QUESTION_END_TOKEN = '[question_end]';

const questions: Record<string, Question[]> = Object.create(null);
const maxQueuedIndex: Record<string, number> = Object.create(null);

const onQuestion$ = of<void>();
const onError$ = of<string>();

const loadingQuestions: Record<string, boolean> = Object.create(null);

const getQuestion = async (
  threadId: string,
  index = (maxQueuedIndex[threadId] ?? 0) + 1
): Promise<Question> => {
  maxQueuedIndex[threadId] = Math.max(index, maxQueuedIndex[threadId] ?? 0);
  questions[threadId] ||= [];

  if (
    !loadingQuestions[threadId] &&
    !questions[threadId][index + PRELOAD_BEFORE]
  ) {
    startQuestionRequest(threadId);
  }

  if (questions[threadId][index]) {
    return questions[threadId][index];
  } else {
    return new Promise((resolve, reject) => {
      const unsubscribeError = onError$.subscribe((errMessage) => {
        unsubscribeError();
        unsubscribeQuestion();
        reject(new Error(errMessage));
      });

      const anyQuestionTimeout = setTimeout(() => {
        unsubscribeError();
        unsubscribeQuestion();
        reject(new Error('Likely thread does not exist, cleanup memory'));
      }, 60000);

      const unsubscribeQuestion = onQuestion$.subscribe(async () => {
        clearTimeout(anyQuestionTimeout);
        if (questions[threadId][index]) {
          unsubscribeError();
          unsubscribeQuestion();
          resolve(questions[threadId][index]);
        }
      });
    });
  }
};

const startQuestionRequest = async (threadId: string) => {
  loadingQuestions[threadId] = true;

  let textValue = '';

  let successFound = false;
  let errorFound = false;
  let questionsFound = false;
  let currentQuestion: Question | undefined;

  for await (const delta of sendMessageReceiveDelta(
    threadId,
    '[get_question]'
  )) {
    markThreadActive(threadId);
    textValue += delta;
    if (!errorFound && textValue.startsWith(ERROR_TOKEN)) {
      textValue = textValue.slice(ERROR_TOKEN.length).trim();
      errorFound = true;
    }
    if (errorFound) {
      return;
    }
    if (!successFound) {
      successFound = textValue.startsWith(SUCCESS_TOKEN);
      if (successFound) {
        textValue = textValue.slice(SUCCESS_TOKEN.length).trim();
      }
    } else {
      if (!currentQuestion) {
        if (textValue.startsWith(QUESTION_START_TOKEN)) {
          textValue = textValue.slice(QUESTION_START_TOKEN.length).trim();
          currentQuestion = {
            question: '',
            answers: [],
            quote: '',
          };
        }
      } else {
        let token = ANSWER_TOKEN;
        let stringLen = textValue.indexOf(token);
        if (stringLen === -1) {
          token = QUOTE_TOKEN;
          stringLen = textValue.indexOf(token);
        }
        if (stringLen === -1) {
          token = QUESTION_END_TOKEN;
          stringLen = textValue.indexOf(token);
        }

        if (stringLen !== -1) {
          const textSection = textValue.slice(0, stringLen).trim();
          textValue = textValue.slice(stringLen + token.length).trim();
          if (token !== QUESTION_END_TOKEN) {
            if (!currentQuestion.question) {
              currentQuestion.question = textSection;
            } else {
              currentQuestion.answers.push(textSection);
            }
          } else {
            currentQuestion.quote = textSection;
            questions[threadId].push(currentQuestion);
            onQuestion$.notify();
            questionsFound = true;
            currentQuestion = undefined;
          }
        }
      }
    }
  }

  if (
    !errorFound &&
    maxQueuedIndex[threadId] + PRELOAD_BEFORE > questions[threadId].length
  ) {
    startQuestionRequest(threadId);
  } else {
    loadingQuestions[threadId] = false;
  }

  if (errorFound) {
    onError$.notify(removeResponseEnd(textValue.trim()));
  } else if (!questionsFound) {
    onError$.notify('Неможливо згенерувати питання за даними матеріалами');
  }
};

export { loadingQuestions, questions as LoadedQuestionsByThread };
export { getQuestion };
