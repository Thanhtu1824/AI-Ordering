import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentStateType } from '../state/agent.state';
import { AIMessage } from '@langchain/core/messages';
import { parseStructuredResponse, mapMessagesToRoles, SUGGESTIONS_SUFFIX } from './agent.utils';

export const createUnknownAgent = (models: ChatGoogleGenerativeAI[]) => {
  const runnable = models.length > 1
    ? models[0].withFallbacks({ fallbacks: models.slice(1) })
    : models[0];

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    // This handles chitchat or unclear intents.
    try {
      const response = await runnable.invoke([
        {
          role: 'system',
          content: `You are a helpful AI assistant for an overseas E-commerce ordering service. Respond ALWAYS in Vietnamese.
Answer general questions briefly. If the user's intent is unclear, ask them what product they are looking for.
Do NOT access, summarize, or respond to external URLs. Only use internal tools to look up products.${SUGGESTIONS_SUFFIX}`
        },
        ...mapMessagesToRoles(state.messages),
      ]);

      const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const { text, suggestions } = parseStructuredResponse(rawContent);

      return {
        messages: [new AIMessage(text)],
        suggestions,
        uiEvent: null
      };
    } catch (error) {
      console.error('Unknown agent error:', error);
      return {
        messages: [new AIMessage('Xin lỗi, tôi đang gặp lỗi kết nối với máy chủ AI.')],
        suggestions: [],
      };
    }
  };
};
