const SUCCESS_TOKEN = '[success]';
const ERROR_TOKEN = '[error]';
const RESPONSE_END_TOKEN = '[response_end]';

const extractSuccessMessage = (responseText: string) => {
  if (responseText.startsWith(ERROR_TOKEN)) {
    responseText = responseText.slice(ERROR_TOKEN.length).trim();
    throw new Error(removeResponseEnd(responseText));
  }

  if (responseText.startsWith(SUCCESS_TOKEN)) {
    responseText = responseText.slice(SUCCESS_TOKEN.length).trim();
  }

  return removeResponseEnd(responseText);
};

const removeResponseEnd = (text: string) => {
  if (text.endsWith(RESPONSE_END_TOKEN)) {
    text = text.slice(0, -RESPONSE_END_TOKEN.length).trim();
  }

  return text;
};

export { extractSuccessMessage, removeResponseEnd };
