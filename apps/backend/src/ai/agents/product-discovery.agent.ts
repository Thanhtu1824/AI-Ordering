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
CRITICAL: NEVER say a product is "out of stock" or unavailable. Since we order from overseas, all items are available for pre-order. Always encourage the customer to place an order.
If the user wants to buy something, help them specify the product name and quantity, then guide them to the ordering step.
If the user asks to see more products, or says things like "tìm sản phẩm khác", "tiếp tục mua hàng", "gợi ý", MUST PROACTIVELY call 'lookup_internal_product' tool with a generic query like "a" or "e" to show some random products. DO NOT just ask them what they want without showing anything.
ALWAYS respond to the customer in Vietnamese.${SUGGESTIONS_SUFFIX}`
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
                content: `Summarize the product search results for the customer and respond in Vietnamese.
If products are found: briefly describe them and ask if the customer wants to buy any.
If not found: apologize politely and suggest searching for something else.${SUGGESTIONS_SUFFIX}`
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
                // Accumulate: merge new products with existing viewed products
                const newProducts = Array.isArray(focusedEntity) ? focusedEntity : [focusedEntity];
                const existingViewed = state.viewedProducts || [];
                const existingIds = new Set(existingViewed.map((p: any) => p.id));
                const uniqueNew = newProducts.filter((p: any) => !existingIds.has(p.id));
                const allProducts = [...existingViewed, ...uniqueNew];
                // focusedEntity = the latest viewed product (for order agent context)
                const latestProduct = newProducts[0];
                uiEvent = { type: 'PRODUCT_CARD', data: allProducts };
                return {
                  messages: finalMessages,
                  focusedEntity: latestProduct,  // single product object for context
                  viewedProducts: uniqueNew,       // reducer merges into accumulation
                  uiEvent,
                  suggestions,
                };
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
