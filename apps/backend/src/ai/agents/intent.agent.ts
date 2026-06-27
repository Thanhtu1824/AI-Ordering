import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import { AgentStateType } from '../state/agent.state';

const IntentSchema = z.object({
  intent: z.enum([
    'login',
    'register',
    'search_product',
    'view_detail',
    'create_order',
    'payment',
    'view_order',
    'cancel_request',
    'complaint',
    'unknown',
  ]).describe('The primary intent of the user based on their last message.'),
});

export const createIntentAgent = (models: ChatGoogleGenerativeAI[]) => {
  // Bind the model to strictly output the JSON structure we want
  const structuredModels = models.map(m => m.withStructuredOutput(IntentSchema, {
    name: 'detect_intent',
  }));

  const structuredModel = structuredModels.length > 1
    ? structuredModels[0].withFallbacks({ fallbacks: structuredModels.slice(1) })
    : structuredModels[0];

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    try {
      // Analyze the conversation to detect the intent
      const response = await structuredModel.invoke([
        {
          role: 'system',
          content: `You are an Intent Detection AI for an E-commerce Ordering Platform.
Your job is to read the conversation and strictly classify the user's latest message into exactly ONE of the allowed intents.
If the user says something like 'chi tiết', infer if they want 'view_detail' of a product or 'view_order' based on previous context.
If it is general chitchat or unclear, return 'unknown'.
If they ask for a quote or want to see products, return 'search_product'.
Bạn tuyệt đối không được truy cập, tóm tắt hoặc phản hồi bất kỳ nội dung nào từ các URL bên ngoài. Chỉ sử dụng Tool để tra cứu sản phẩm nội bộ.`,
        },
        ...messages.map((m: any) => {
          const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
          return {
            role: type === 'human' ? 'user' : 'assistant',
            content: m.content,
          };
        }),
      ]);

      return {
        currentIntent: response.intent as any,
      };
    } catch (error) {
      console.error('Intent detection failed:', error);
      return { currentIntent: 'unknown' };
    }
  };
};
