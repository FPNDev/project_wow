// const ApiURL = `http://${location.hostname}:151`;
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

  return new Promise<string>((resolve) =>
    setTimeout(() => resolve('dummythreadid'), 5000),
  );

  // return fetch(`${ApiURL}/create`, {
  //   method: 'POST',
  //   body: formData,
  // }).then(async (r) => {
  //   if (!r.ok) {
  //     return Promise.reject(r);
  //   }

  //   const resp = await r.json();
  //   if (!resp.ok) {
  //     throw new Error(resp.errorMessage);
  //   } else {
  //     return resp.threadId;
  //   }
  // });
};

const setTopic = (_threadId: string, _topic: string) => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(Math.round(Math.random() * 15)), 5000),
  );

  // return fetch(`${ApiURL}/${threadId}/topic`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     topic,
  //   }),
  // }).then(async (r) => {
  //   if (!r.ok) {
  //     return Promise.reject(r);
  //   }

  //   const resp = await r.json();
  //   if (!resp.ok) {
  //     throw new Error(resp.errorMessage);
  //   } else {
  //     return resp.startsAt;
  //   }
  // });
};

const generateDummyQuestion = (num: number): QuestionData => {
  return {
    question: `Dummy question #${num + 1}`,
    answers: [
      `Dummy answer A for question #${num + 1}`,
      `Dummy answer B for question #${num + 1}`,
      `Dummy answer C for question #${num + 1}`,
      `Dummy answer D for question #${num + 1}`,
    ],
    quote: `This is a dummy quote for question #${num + 1}.`,
  };
};

const getQuestionFromThread = (_threadId: string, questionId?: number) => {
  return dummifyGetQuestionFromThread(questionId);
  // return fetch(
  //   `${ApiURL}/${threadId}/question/${questionId !== undefined ? questionId : ''}`,
  // ).then(async (r) => {
  //   if (!r.ok) {
  //     throw new Error(await r.text());
  //   }

  //   return r.json() as Promise<QuestionData>;
  // });
};

function dummifyGetQuestionFromThread(questionId?: number) {
  return new Promise<QuestionData>((resolve) => {
    setTimeout(() => {
      resolve(generateDummyQuestion(questionId ?? 0));
    }, 500);
  });
}

export { GPTFileAccept };
export { createThread, getQuestionFromThread, setTopic };
