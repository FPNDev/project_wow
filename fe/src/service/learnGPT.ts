const ApiURL = `http://${location.hostname}:151`;
const GPTFileAccept =
  'text/x-c,text/x-c++,text/x-csharp,text/css,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/x-golang,text/html,text/x-java,text/javascript,application/json,text/markdown,application/pdf,text/x-php,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/x-python,text/x-script.python,text/x-ruby,application/x-sh,text/x-tex,application/typescript,text/plain';

export type QuestionData = {
  question: string;
  answers: string[];
  quote: string;
};

const createThread = (text: string, files?: FileList | null) => {
  const formData = new FormData();
  formData.set('text', text);
  if (files?.length) {
    for (let idx = 0; idx < files.length; idx++) {
      formData.append('files[]', files[idx]);
    }
  }

  return fetch(`${ApiURL}/create`, {
    method: 'POST',
    body: formData,
  }).then(async (r) => {
    if (!r.ok) {
      return Promise.reject(r);
    }

    const resp = await r.json();
    if (!resp.ok) {
      throw new Error(resp.errorMessage);
    } else {
      return resp.threadId;
    }
  });
};

const setTopic = (threadId: string, topic: string) => {
  return fetch(`${ApiURL}/topic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      threadId,
      topic,
    }),
  }).then(async (r) => {
    if (!r.ok) {
      return Promise.reject(r);
    }

    const resp = await r.json();
    if (!resp.ok) {
      throw new Error(resp.errorMessage);
    } else {
      return resp.startsAt;
    }
  });
};

const getQuestionFromThread = (threadId: string, questionId?: number) => {
  const urlParams = new URLSearchParams({
    threadId,
    ...(questionId !== undefined ? { questionId: questionId.toString() } : {}),
  });

  return fetch(`${ApiURL}/question?${urlParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((r) => {
    if (!r.ok) {
      return Promise.reject(r);
    }

    return r.json() as Promise<QuestionData>;
  });
};

export { GPTFileAccept };
export { createThread, getQuestionFromThread, setTopic };
