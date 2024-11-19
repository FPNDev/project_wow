import { APIError } from 'openai/error';
import { AssistantStreamEvent } from 'openai/resources/beta/assistants';
import { TextDelta } from 'openai/resources/beta/threads/messages';
import { AssistantStream } from 'openai/lib/AssistantStream';

import { Observable } from '../observable';
import { openai } from '../openai';
import { startRunOnThread } from './run';
import { handleFunctions } from './functions';

interface MessageConfig {
  threadId: string;
  message: string;
}

type QueueEntry = [Omit<MessageConfig, 'threadId'>, Observable<string>];

const MessageQueue: Record<string, QueueEntry[]> = {};
const queueRunning: Record<string, boolean> = {};

const sendMessage = (
  threadId: MessageConfig['threadId'],
  message: MessageConfig['message']
) =>
  new Promise<string>((resolve) => {
    let textValue = '';
    const textDelta$ = sendMessageReceiveDelta(threadId, message);
    textDelta$.subscribe((delta) => {
      textValue += delta;
    });
    textDelta$.subscribeDone(() => resolve(textValue));
  });

const sendMessageReceiveDelta = (
  threadId: MessageConfig['threadId'],
  message: MessageConfig['message']
): Observable<string> => {
  const onTextDelta$ = Observable<string>();
  const queueEntry = [{ message }, onTextDelta$] as QueueEntry;
  if (!queueRunning[threadId]) {
    MessageQueue[threadId] = [queueEntry];
    runMessageQueue(threadId);
  } else {
    MessageQueue[threadId].push(queueEntry);
  }

  return onTextDelta$;
};

const runMessageQueue = async (threadId: string) => {
  queueRunning[threadId] = true;

  let activeRunStream!: AssistantStream;

  const [{ message }, onTextDelta$] = MessageQueue[threadId].shift()!;

  const createMessageAndStream = async () => {
    const handleAPIError = (restartRequest = false) => {
      if (restartRequest) {
        MessageQueue[threadId].unshift([{ message }, onTextDelta$]);
        setTimeout(() => runMessageQueue(threadId), 5000);
      } else {
        onTextDelta$.done();
      }
    };

    onTextDelta$.subscribeDone(() => {
      disableRunStreamListeners();

      if (MessageQueue[threadId].length) {
        runMessageQueue(threadId);
      } else {
        queueRunning[threadId] = false;
      }
    });

    try {
      await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: message,
      });
    } catch (e: unknown) {
      if (
        e &&
        (<APIError>e).type === 'invalid_request_error' &&
        ((<APIError>e).status === 404 || (<APIError>e).status === 400)
      ) {
        handleAPIError((<APIError>e).status === 400);
        return;
      }

      throw e;
    }

    try {
      activeRunStream = startRunOnThread(threadId);
    } catch (_) {
      handleAPIError(true);
      return;
    }

    listenToRunStream();
  };

  createMessageAndStream();

  const listenToRunStream = () => {
    activeRunStream.on('event', handleStreamEvent);
    activeRunStream.on('textDelta', handleTextDelta);
    activeRunStream.on('error', onTextDelta$.done);
    activeRunStream.on('abort', onTextDelta$.done);
  };

  const disableRunStreamListeners = () => {
    if (activeRunStream) {
      activeRunStream.off('event', handleStreamEvent);
      activeRunStream.off('textDelta', handleTextDelta);
      activeRunStream.off('error', onTextDelta$.done);
      activeRunStream.off('abort', onTextDelta$.done);
    }
  };

  const handleStreamEvent = async (ev: AssistantStreamEvent) => {
    if (ev.event === 'thread.run.requires_action' && ev.data.required_action) {
      disableRunStreamListeners();
      activeRunStream = await openai.beta.threads.runs.submitToolOutputsStream(
        threadId,
        ev.data.id,
        { tool_outputs: await handleFunctions(ev.data.required_action) }
      );
      listenToRunStream();
    } else if (
      ev.event === 'thread.run.failed' &&
      ev.data.last_error?.code === 'rate_limit_exceeded'
    ) {
      disableRunStreamListeners();
      setTimeout(
        createMessageAndStream,
        getTimeoutAmountFromErrorMessage(
          ev.data.last_error!.message,
          ev.data.failed_at!
        )
      );
    } else if (
      ev.event === 'thread.run.completed' ||
      ev.event === 'thread.run.cancelled' ||
      ev.event === 'thread.run.failed' ||
      ev.event === 'thread.run.expired'
    ) {
      onTextDelta$.done();
    }
  };

  const handleTextDelta = (textDelta: TextDelta) => {
    if (textDelta.value) {
      onTextDelta$.notify(textDelta.value);
    }
  };
};

const getTimeoutAmountFromErrorMessage = (
  errMessage: string,
  failedAt: number
) => {
  const matchedTime = errMessage.match(/(\d+\.\d+)s/)?.[1];
  return matchedTime
    ? failedAt - Date.now() / 1000 + +matchedTime * 1000
    : 5000;
};

export { sendMessage, sendMessageReceiveDelta };
