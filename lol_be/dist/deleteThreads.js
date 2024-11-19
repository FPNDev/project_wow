"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("./openai");
const THREADS_TO_DELETE = [
    "thread_VfHg2atssqn9qZP854p9ugn9",
    "thread_4x4o6s7AFe4DHR88cmNZytWJ",
    "thread_oFzAs12cCpoS6be82JCU0XVn",
    "thread_b4ltTRBzRRYjxzq40tU5USPy",
    "thread_v8p3GpqckFdEiqwPKGE2mCxJ",
    "thread_fKLWIKbmzPHdVdnBDZW7exoA",
    "thread_xKQaCvYX9DOdsY1HpqdvQVcS",
    "thread_oycPkmkH1EkGT74Sm1qmWMXs",
    "thread_Z9NwXa5fZ5Cu5XqzmfE7FnDO",
    "thread_sXqdA3oJ4ZancjE45ajlvQhX",
    "thread_4nZPdYzTKgt5JIHnoTmF5khb",
    "thread_6YLEKGbe3XV06RUj0fRjm8H7",
    "thread_BIAOhaCN3lWYhc5KIp9dRhGu",
    "thread_uYuecX31akRHKXKUmTqIvhlu",
    "thread_eVubuU9VoiYoqBrfkaDwUpT5",
    "thread_1D9hDYOtX2Fk2BqjsiUVtLtx",
    "thread_fqin61kb0JZf5m43XylZ8lHI"
];
for (const thread of THREADS_TO_DELETE) {
    openai_1.openai.beta.threads.del(thread).then(console.log).catch(console.error);
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
