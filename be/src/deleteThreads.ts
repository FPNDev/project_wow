import { openai } from './openai';

const THREADS_TO_DELETE = [
  "thread_qF76lstBfuWaFf1QiBmz8gLy",
  "thread_bO90yEttHyjbrFf8heJJtvXq",
  "thread_tkixYy94vAaweE9hsWSobkRY",
  "thread_NHa9qbGOet3NBgehZHvGhQqD",
  "thread_HmPugQuJFDY1bQ70I8ljb5h6",
  "thread_hD0njwjU7z96rn5byWmfvaY7",
  "thread_Zh9jFdyDllkSx0QJd97YfXyZ",
  "thread_DXlHp8IwklsgaDv1IRCEPkYM",
  "thread_hmaOLN5mPi2Q8bG8HKXQ4Xcj",
  "thread_eLxSLiPVrU46oxkYVOVNG22f",
  "thread_if0JyOtFdy0rZ0AIm4KbUSZJ",
  "thread_Q2mITuCAiEQKw2R2Fj7BEbpW"
] as const;

for (const thread of THREADS_TO_DELETE) {
  openai.beta.threads.del(thread).then(console.log).catch(console.error);
}

/*
  await fetch("https://api.openai.com/v1/threads?limit=30", {
    "headers": {
      "authorization": "Bearer sess-lJxKuOWysb951F10YPzkjc51lHZUcNvsX2GkZnUX",
      "openai-beta": "assistants=v2",
      "openai-organization": "org-KRLmxLyeHJwHoabb5tqLa9J8",
      "openai-project": "proj_jxM8EjeYhcZ6ppP4vHT2BLMy",
    },
  }).then(r => r.json()).then(v => Object.values(v.data).map(i => i.id));
*/
