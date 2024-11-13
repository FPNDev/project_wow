import { abortRunOnThread, sendMessage } from '../gpt';
import { openai } from '../openai';

const SUCCESS_TOKEN = '[success]' as const;
const ERROR_TOKEN = '[error]' as const;

const ActiveThreads = new Set<string>();

const doesThreadExist = async (threadId: string) => {
  if (ActiveThreads.has(threadId)) {
    return true;
  }

  try {
    await openai.beta.threads.retrieve(threadId);
    markThreadActive(threadId);
    return true;
  } catch (_: unknown) {
    return false;
  }
};

const createThread = async (text: string, files?: Express.Multer.File[]) => {
  const thread = await openai.beta.threads.create();
  markThreadActive(thread.id);

  const answer = (
    await sendMessage(thread.id, `[setup_text]\n${text}`, files)
  )?.trim();

  if (answer?.startsWith(SUCCESS_TOKEN)) {
    return thread.id;
  }

  markThreadInactive(thread.id);
  await openai.beta.threads.del(thread.id);

  if (answer?.startsWith(ERROR_TOKEN)) {
    throw new Error(answer.slice(ERROR_TOKEN.length).trim());
  }

  throw new Error('Невідома помилка ' + answer);
};

const setThreadTopic = async (threadId: string, topic = 'No topic') => {
  abortRunOnThread(threadId);
  const answer = (await sendMessage(threadId, `[set_topic]\n${topic}`))?.trim();

  if (answer?.startsWith(SUCCESS_TOKEN)) {
    return answer;
  }

  if (answer?.startsWith(ERROR_TOKEN)) {
    throw new Error(answer.slice(ERROR_TOKEN.length).trim());
  }

  throw new Error('Невідома помилка ' + answer);
};

const markThreadActive = (threadId: string) => {
  ActiveThreads.add(threadId);
};
const markThreadInactive = (threadId: string) => {
  ActiveThreads.delete(threadId);
};

export {
  createThread,
  setThreadTopic,
  doesThreadExist,
  markThreadActive,
  markThreadInactive,
};
