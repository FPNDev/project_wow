import { abortRunOnThread, sendMessage } from '../gpt';
import { openai } from '../openai';
import { extractSuccessMessage } from './response';

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

const createThread = async (text: string, files: Express.Multer.File[]) => {
  const thread = await openai.beta.threads.create();
  markThreadActive(thread.id);

  let finalText = text;
  if (files.length) {
    const fileSummary = '';
    console.log(fileSummary.length, fileSummary.slice(0, 250));
    finalText += '\n' + fileSummary;
  }

  const answer = (
    await sendMessage(thread.id, `[setup_text]\n${finalText}`)
  )?.trim();
  try {
    extractSuccessMessage(answer);
    return thread.id;
  } catch (err: unknown) {
    markThreadInactive(thread.id);
    await openai.beta.threads.del(thread.id);

    throw err;
  }
};

const setThreadTopic = async (threadId: string, topic = 'No topic') => {
  abortRunOnThread(threadId);
  const answer = (await sendMessage(threadId, `[set_topic]\n${topic}`))?.trim();
  return extractSuccessMessage(answer);
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
