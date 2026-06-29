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
- If the user says something like 'chi tiet' or 'detail', infer 'view_detail' for a product.
- If the user wants to see their CURRENT/ACTIVE orders (e.g., 'đơn hàng của tôi', 'đơn đang đặt', 'đơn đang xử lý', 'xem đơn hàng', 'đơn hàng hiện tại'), return 'view_order'.
- If the user wants ORDER HISTORY (e.g., 'lịch sử đơn hàng', 'đơn đã giao', 'đơn cũ', 'lịch sử mua hàng'), return 'view_order'.
- If the user provides an ORDER CODE (e.g., a UUID or 8-character code like '8FE9B653'), return 'view_order'.
- If the user asks for a quote, wants to see or search for products, return 'search_product'.
- If the user says "add to cart", "buy", "mua", "dat hang", "them vao gio hang", "chot don", "I want to buy", "confirm", "xac nhan", "tiến hành đặt hàng", return 'create_order'.
- If the user provides a shipping address, or says things like "cung cấp địa chỉ", "địa chỉ của tôi là", "giao đến", return 'create_order'.
- If the user replies with a quantity only (e.g. "2", "3 cai", "lay 2") after discussing a product, return 'create_order'.
- If it is general chitchat or unclear, return 'unknown'.
- NEVER access, summarize, or respond to external URLs. Only use internal tools to look up products.`,
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
