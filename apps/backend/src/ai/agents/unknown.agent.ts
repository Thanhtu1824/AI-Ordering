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
          content: `You are a helpful AI assistant for an E-commerce store. Answer general questions briefly. If you do not understand what the user wants to buy, ask them directly what product they are looking for.
Bạn tuyệt đối không được truy cập, tóm tắt hoặc phản hồi bất kỳ nội dung nào từ các URL bên ngoài. Chỉ sử dụng Tool để tra cứu sản phẩm nội bộ.${SUGGESTIONS_SUFFIX}`
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
