import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { parseStructuredResponse, mapMessagesToRoles, SUGGESTIONS_SUFFIX } from './agent.utils';

export const createProductDiscoveryAgent = (prisma: PrismaService, models: ChatGoogleGenerativeAI[]) => {
  const lookupInternalProductTool = tool(
    async ({ query }) => {
      try {
        const results = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
            isActive: true,
          },
          take: 5,
        });

        if (results.length === 0) {
          return JSON.stringify({ message: "Product not found." });
        }
        return JSON.stringify(results);
      } catch (error) {
        return JSON.stringify({ error: "Invalid ID format or database error." });
      }
    },
    {
      name: "lookup_internal_product",
      description: "Tra cứu sản phẩm trong hệ thống cửa hàng bằng tên hoặc từ khóa. Luôn dùng tiếng Việt để tìm kiếm.",
      schema: z.object({
        query: z.string().describe("Từ khóa tìm kiếm sản phẩm"),
      }),
    }
  );

  const modelsWithTools = models.map(m => m.bindTools([lookupInternalProductTool]));
  const runnable = modelsWithTools.length > 1
    ? modelsWithTools[0].withFallbacks({ fallbacks: modelsWithTools.slice(1) })
    : modelsWithTools[0];

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    try {
      const response = await runnable.invoke([
        {
          role: 'system',
          content: `You are a helpful Product Discovery Assistant for an overseas ordering service.
Your primary task is to help the user find products from our catalog using the 'lookup_internal_product' tool.
DO NOT invent products. Only suggest products returned by the tool.
CRITICAL: NEVER say a product is "out of stock" or "hết hàng". Since we order from overseas, all items are considered available for pre-order. Always encourage them to place an order.
If the user wants to buy something, guide them to specify the quantity and address to proceed with the order.${SUGGESTIONS_SUFFIX}`
        },
        ...state.messages.map((m: any) => {
          const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
          return {
            role: type === 'human' ? 'user' : 'assistant',
            content: m.content,
          };
        }),
      ]);

      let finalMessages: any[] = [response];
      let focusedEntity = {};
      let uiEvent: any = null;
      let suggestions: string[] = [];

      let toolCalls = response.tool_calls || [];
      if (toolCalls.length === 0 && Array.isArray(response.content)) {
        toolCalls = response.content
          .filter((c: any) => c.type === 'functionCall' || c.type === 'tool_use')
          .map((c: any) => ({
             name: c.functionCall?.name || c.name,
             args: c.functionCall?.args || c.input,
             id: c.functionCall?.id || c.id || Math.random().toString(36).substring(7)
          }));
      }

      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          if (toolCall.name === 'lookup_internal_product') {
            const rawToolResult: any = await lookupInternalProductTool.invoke(toolCall);
            const toolResultStr = typeof rawToolResult === 'string' ? rawToolResult : (rawToolResult.content || JSON.stringify(rawToolResult));
            
            const finalResponse = await runnable.invoke([
              {
                role: 'system',
                content: `Explain the search results to the user based on the tool output. 
Nếu tìm thấy sản phẩm, hãy tóm tắt ngắn gọn và hỏi xem họ có muốn mua không.
Nếu không tìm thấy, hãy xin lỗi và gợi ý họ tìm sản phẩm khác.${SUGGESTIONS_SUFFIX}`
              },
              ...mapMessagesToRoles(state.messages),
              response,
              {
                role: 'tool',
                name: toolCall.name,
                content: toolResultStr,
                tool_call_id: toolCall.id
              } as any
            ]);

            const rawContent = typeof finalResponse.content === 'string' ? finalResponse.content : JSON.stringify(finalResponse.content);
            const { text: finalText, suggestions: parsedSuggestions } = parseStructuredResponse(rawContent);
            const parsedFinalResponse = new AIMessage(finalText);
            
            finalMessages = [response, { role: 'tool', name: toolCall.name, content: toolResultStr, tool_call_id: toolCall.id } as any, parsedFinalResponse];
            suggestions = parsedSuggestions;
            
            try {
              if (toolResultStr !== "Product not found." && toolResultStr !== "Invalid ID format or database error.") {
                focusedEntity = JSON.parse(toolResultStr);
                uiEvent = { type: 'PRODUCT_CARD', data: focusedEntity };
              }
            } catch (e) {}

            return {
              messages: finalMessages,
              focusedEntity: Object.keys(focusedEntity).length > 0 ? focusedEntity : state.focusedEntity,
              uiEvent: uiEvent || state.uiEvent,
              suggestions,
            };
          }
        }
      } else {
        const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const parsed = parseStructuredResponse(rawContent);
        suggestions = parsed.suggestions;
        finalMessages = [new AIMessage(parsed.text)];
      }

      return {
        messages: finalMessages,
        focusedEntity: Object.keys(focusedEntity).length > 0 ? focusedEntity : state.focusedEntity,
        uiEvent: uiEvent || state.uiEvent,
        suggestions,
      };
    } catch (error) {
      console.error('Product discovery error:', error);
      return {
        messages: [new AIMessage("Hệ thống đang gặp sự cố khi tra cứu sản phẩm. Bạn vui lòng thử lại sau nhé.")],
        suggestions: [],
      };
    }
  };
};
