import OpenAI from 'openai';
import { AssistantStream } from 'openai/lib/AssistantStream';
import { Run } from 'openai/resources/beta/threads/runs/runs';

import { assistantId, openai } from '../openai';

type ThreadRunEnded =
  | OpenAI.Beta.Assistants.AssistantStreamEvent.ThreadRunCancelled
  | OpenAI.Beta.Assistants.AssistantStreamEvent.ThreadRunFailed
  | OpenAI.Beta.Assistants.AssistantStreamEvent.ThreadRunExpired
  | OpenAI.Beta.Assistants.AssistantStreamEvent.ThreadRunCompleted;

const ThreadRun: Record<string, AssistantStream> = {};

const abortRunOnThread = async (threadId: string) => {
  const runStream = ThreadRun[threadId];

  if (runStream) {
    let currentRun = runStream.currentRun() as Run;
    if (!currentRun) {
      currentRun = await new Promise((resolve) => {
        runStream.on('event', (ev) => {
          resolve(ev.data as Run);
        });
      });
    }

    if (
      currentRun.status === 'queued' ||
      currentRun.status === 'expired' ||
      currentRun.status === 'cancelled' ||
      currentRun.status === 'completed' ||
      currentRun.status === 'failed'
    ) {
      if (!runStream.aborted) {
        runStream.abort();
      } else {
        return;
      }
    }

    await openai.beta.threads.runs
      .cancel(threadId, currentRun.id)
      .catch((e) => {
        if (
          e.status !== 400
          /* likely actually cancelled! */
        ) {
          throw e;
        }
      });

    return handleRunStreamEnd(runStream);
  }
};

const startRunOnThread = (threadId: string) => {
  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
    max_completion_tokens: 3500,
  });

  ThreadRun[threadId] = stream;
  handleRunStreamEnd(stream).then(() => {
    delete ThreadRun[threadId];
  });

  return stream;
};
const handleRunStreamEnd = (stream: AssistantStream) => {
  if (isRunStreamOver(stream)) {
    return Promise.resolve();
  }

  return new Promise<void | ThreadRunEnded>((resolve) => {
    stream.on('event', (e) => {
      if (
        e.event === 'thread.run.completed' ||
        e.event === 'thread.run.cancelled' ||
        e.event === 'thread.run.failed' ||
        e.event === 'thread.run.expired'
      ) {
        resolve(e);
      }
    });
    stream.on('error', (_) => {
      resolve();
    });
    stream.on('abort', (_) => {
      resolve();
    });
  });
};

const isRunStreamOver = (stream: AssistantStream) => {
  const currentRun = stream.currentRun();
  if (currentRun) {
    if (
      currentRun.status === 'cancelled' ||
      currentRun.status === 'expired' ||
      currentRun.status === 'completed' ||
      currentRun.status === 'failed'
    ) {
      return true;
    }
  }

  return stream.aborted;
};

export { handleRunStreamEnd };
export { abortRunOnThread, startRunOnThread };
