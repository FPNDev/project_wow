import { Run } from 'openai/resources/beta/threads/runs/runs';
import { loadWebsite } from './loadWebsite';

const ToolFunctions = {
  load_webpage: ({ url }: { url: string }) => loadWebsite(url),
} as const;

const handleFunctions = (requiredAction: Run.RequiredAction) => {
  return Promise.all(
    requiredAction.submit_tool_outputs.tool_calls.map(async (toolCall) => {
      if (toolCall.function.name in ToolFunctions) {
        const handler =
          ToolFunctions[toolCall.function.name as keyof typeof ToolFunctions];

        if (handler) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let args: any = [];
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch (_) {
            /* empty */
          }

          return {
            tool_call_id: toolCall.id,
            output: await handler(args),
          };
        }
      }

      return {
        tool_call_id: toolCall.id,
        output: '',
      };
    }) ?? []
  );
};

export { handleFunctions };
