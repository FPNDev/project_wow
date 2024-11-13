import OpenAI from 'openai';
import fs from 'fs';

import { openai } from '../openai';

export const GPT_FILE_FORMATS = [
  'c',
  'cpp',
  'cs',
  'css',
  'doc',
  'docx',
  'go',
  'html',
  'java',
  'js',
  'json',
  'md',
  'pdf',
  'php',
  'pptx',
  'ppt',
  'py',
  'py',
  'sh',
  'ts',
  'xlsx',
  'xls',
  'txt',
] as readonly string[];

const uploadFilesAsAttachments = async (files?: Express.Multer.File[]) => {
  const attachments: OpenAI.Beta.Threads.MessageCreateParams.Attachment[] = [];
  if (files?.length) {
    const filesPromises = [];
    for (let idx = 0; idx < files.length; idx++) {
      const readStream = fs.createReadStream(files[idx].path);
      filesPromises.push(
        openai.files.create({
          purpose: 'assistants',
          file: readStream,
        })
      );
    }

    const settledResults = await Promise.allSettled(filesPromises);
    for (let idx = 0; idx < settledResults.length; idx++) {
      const res = settledResults[idx];
      if (res.status === 'fulfilled') {
        attachments.push({
          file_id: res.value.id,
          tools: [{ type: 'file_search' }],
        });
      }
    }
  }

  return attachments;
};

export { uploadFilesAsAttachments };
