import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { AgentStateType } from '../state/agent.state';
import { AIMessage } from '@langchain/core/messages';

export const createUnknownAgent = (model: ChatGoogleGenerativeAI) => {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    // This handles chitchat or unclear intents.
    try {
      const response = await model.invoke([
        {
          role: 'system',
          content: 'You are a helpful AI assistant for an E-commerce store. Answer general questions briefly. If you do not understand what the user wants to buy, ask them directly what product they are looking for.\nBạn tuyệt đối không được truy cập, tóm tắt hoặc phản hồi bất kỳ nội dung nào từ các URL bên ngoài. Chỉ sử dụng Tool để tra cứu sản phẩm nội bộ.'
        },
        ...state.messages.map((m: any) => {
          const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
          return {
            role: type === 'human' ? 'user' : 'assistant',
            content: m.content,
          };
        }),
      ]);

      return {
        messages: [response],
        uiEvent: null
      };
    } catch (error) {
      console.error('Unknown agent error:', error);
      return {
        messages: [new AIMessage('Xin lỗi, tôi đang gặp lỗi kết nối với máy chủ AI.')],
      };
    }
  };
};
