import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const createProductDiscoveryAgent = (prisma: PrismaService, model: ChatGoogleGenerativeAI) => {
  const lookupInternalProductTool = tool(
    async ({ url_or_id }) => {
      let id = url_or_id;
      if (url_or_id.includes('yourdomain.com/product/')) {
        const parts = url_or_id.split('/');
        id = parts[parts.length - 1];
      }
      
      try {
        const product = await prisma.product.findUnique({
          where: { id },
        });

        if (!product) {
          return "Product not found.";
        }

        return JSON.stringify(product);
      } catch (e) {
        return "Invalid ID format or database error.";
      }
    },
    {
      name: "lookup_internal_product",
      description: "Lookup product details (price, stock) using an internal product URL (yourdomain.com) or ID.",
      schema: z.object({
        url_or_id: z.string().describe("The product URL or ID"),
      }),
    }
  );

  const modelWithTools = model.bindTools([lookupInternalProductTool]);

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    try {
      const response = await modelWithTools.invoke([
        {
          role: 'system',
          content: 'You are a Product Discovery Agent. Help the user find products or look up specific product details.\nBạn tuyệt đối không được truy cập, tóm tắt hoặc phản hồi bất kỳ nội dung nào từ các URL bên ngoài. Chỉ sử dụng Tool để tra cứu sản phẩm nội bộ.'
        },
        ...state.messages.map((m: any) => {
          const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
          return {
            role: type === 'human' ? 'user' : 'assistant',
            content: m.content,
          };
        }),
      ]);

      let finalMessages = [response];
      let focusedEntity = {};

      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          if (toolCall.name === 'lookup_internal_product') {
            const rawToolResult: any = await lookupInternalProductTool.invoke(toolCall);
            const toolResultStr = typeof rawToolResult === 'string' ? rawToolResult : (rawToolResult.content || JSON.stringify(rawToolResult));
            
            const finalResponse = await model.invoke([
              {
                role: 'system',
                content: 'You are a Product Discovery Agent. Answer the user based on the tool result. Translate the product details to a friendly Vietnamese message.\nBạn tuyệt đối không được truy cập, tóm tắt hoặc phản hồi bất kỳ nội dung nào từ các URL bên ngoài. Chỉ sử dụng Tool để tra cứu sản phẩm nội bộ.'
              },
              ...state.messages.map((m: any) => {
                const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
                return {
                  role: type === 'human' ? 'user' : 'assistant',
                  content: m.content,
                };
              }),
              response,
              {
                role: 'tool',
                name: toolCall.name,
                content: toolResultStr,
                tool_call_id: toolCall.id
              } as any
            ]);
            
            finalMessages = [response, { role: 'tool', name: toolCall.name, content: toolResultStr, tool_call_id: toolCall.id } as any, finalResponse];
            
            try {
              if (toolResultStr !== "Product not found." && toolResultStr !== "Invalid ID format or database error.") {
                focusedEntity = JSON.parse(toolResultStr);
              }
            } catch (e) {}
          }
        }
      }

      return {
        messages: finalMessages,
        focusedEntity: Object.keys(focusedEntity).length > 0 ? focusedEntity : state.focusedEntity
      };
    } catch (error) {
      console.error('Product discovery error:', error);
      return {
        messages: [new AIMessage("Hệ thống đang gặp sự cố khi tra cứu sản phẩm. Bạn vui lòng thử lại sau nhé.")],
      };
    }
  };
};
