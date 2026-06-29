import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { parseStructuredResponse, mapMessagesToRoles, SUGGESTIONS_SUFFIX } from './agent.utils';

const ACTIVE_STATUSES = ['PENDING', 'AWAITING_QUOTE', 'PROCESSING', 'SHIPPED'];
const HISTORY_STATUSES = ['DELIVERED', 'CANCELLED'];

export const createOrderTrackingAgent = (prisma: PrismaService, models: ChatGoogleGenerativeAI[]) => {
  const lookupOrderByIdTool = tool(
    async ({ orderId, userId }) => {
      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: orderId },
              { id: { startsWith: orderId.toLowerCase() } },
            ]
          },
          include: {
            items: { include: { product: true } }
          }
        });

        if (!order) {
          return JSON.stringify({ success: false, message: "Không tìm thấy đơn hàng với mã này." });
        }

        if (order.userId !== userId) {
          return JSON.stringify({ success: false, message: "Đơn hàng này không thuộc về tài khoản của bạn." });
        }

        return JSON.stringify({ success: true, order });
      } catch (error) {
        return JSON.stringify({ success: false, message: "Lỗi hệ thống hoặc mã đơn hàng không hợp lệ." });
      }
    },
    {
      name: "lookup_order_by_id",
      description: "Tra cứu chi tiết một đơn hàng cụ thể theo mã đơn hàng.",
      schema: z.object({
        orderId: z.string().describe("Mã đơn hàng (UUID hoặc 8 ký tự đầu)"),
        userId: z.string().describe("ID người dùng hiện tại"),
      }),
    }
  );

  const lookupActiveOrdersTool = tool(
    async ({ userId }) => {
      try {
        const orders = await prisma.order.findMany({
          where: {
            userId,
            status: { in: ACTIVE_STATUSES as any[] }
          },
          include: {
            items: { include: { product: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'desc' }
        });
        return JSON.stringify({ success: true, orders, type: 'active' });
      } catch (error) {
        return JSON.stringify({ success: false, message: "Lỗi hệ thống khi lấy danh sách đơn hàng." });
      }
    },
    {
      name: "lookup_active_orders",
      description: "Lấy tất cả đơn hàng đang hoạt động (PENDING, PROCESSING, SHIPPED) của người dùng.",
      schema: z.object({
        userId: z.string().describe("ID người dùng"),
      }),
    }
  );

  const lookupOrderHistoryTool = tool(
    async ({ userId }) => {
      try {
        const orders = await prisma.order.findMany({
          where: {
            userId,
            status: { in: HISTORY_STATUSES as any[] }
          },
          include: {
            items: { include: { product: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
        return JSON.stringify({ success: true, orders, type: 'history' });
      } catch (error) {
        return JSON.stringify({ success: false, message: "Lỗi hệ thống khi lấy lịch sử đơn hàng." });
      }
    },
    {
      name: "lookup_order_history",
      description: "Lấy lịch sử các đơn hàng đã hoàn thành hoặc đã hủy của người dùng.",
      schema: z.object({
        userId: z.string().describe("ID người dùng"),
      }),
    }
  );

  const allTools = [lookupOrderByIdTool, lookupActiveOrdersTool, lookupOrderHistoryTool];

  const modelsWithTools = models.map(m => m.bindTools(allTools));
  const runnable = modelsWithTools.length > 1
    ? modelsWithTools[0].withFallbacks({ fallbacks: modelsWithTools.slice(1) })
    : modelsWithTools[0];

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    if (!state.currentUser || !state.currentUser.sub) {
      return {
        messages: [new AIMessage("Vui lòng đăng nhập để có thể tra cứu thông tin đơn hàng của bạn.")],
        currentIntent: 'login'
      };
    }

    const userId = state.currentUser.sub;

    try {
      const response = await runnable.invoke([
        {
          role: 'system',
          content: `You are an Order Tracking Assistant for an overseas ordering platform.
The user's ID is ${userId}.

Available tools:
- "lookup_order_by_id": use when the user provides a specific order code (UUID or first 8 chars like "8FE9B653").
- "lookup_active_orders": use when the user wants to see their CURRENT/ACTIVE orders ("đơn đang đặt", "đơn đang xử lý", "đơn hàng của tôi").
- "lookup_order_history": use when the user wants their ORDER HISTORY ("lịch sử đơn", "đơn đã giao", "đơn đã hủy").

Rules:
- If the user provides a short code like "8FE9B653" (first 8 chars), use "lookup_order_by_id" with that code.
- If no order code is provided and user wants current orders, call "lookup_active_orders" immediately.
- If no order code is provided and user wants history, call "lookup_order_history" immediately.
- ALWAYS pass ${userId} as userId.
- Respond in Vietnamese.${SUGGESTIONS_SUFFIX}`
        },
        ...mapMessagesToRoles(state.messages),
      ]);

      let finalMessages: any[] = [response];
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
          let rawToolResult: any;

          if (toolCall.name === 'lookup_order_by_id') {
            rawToolResult = await lookupOrderByIdTool.invoke(toolCall);
          } else if (toolCall.name === 'lookup_active_orders') {
            rawToolResult = await lookupActiveOrdersTool.invoke(toolCall);
          } else if (toolCall.name === 'lookup_order_history') {
            rawToolResult = await lookupOrderHistoryTool.invoke(toolCall);
          } else {
            continue;
          }

          const toolResultStr = typeof rawToolResult === 'string' ? rawToolResult : (rawToolResult.content || JSON.stringify(rawToolResult));
          const parsedResult = JSON.parse(toolResultStr);

          if (parsedResult.success) {
            if (toolCall.name === 'lookup_order_by_id') {
              uiEvent = { type: 'ORDER_TRACKING', data: parsedResult.order };
            } else if (toolCall.name === 'lookup_active_orders') {
              uiEvent = { type: 'ORDER_LIST', data: { orders: parsedResult.orders, listType: 'active' } };
            } else if (toolCall.name === 'lookup_order_history') {
              uiEvent = { type: 'ORDER_LIST', data: { orders: parsedResult.orders, listType: 'history' } };
            }
          }

          const finalResponse = await runnable.invoke([
            {
              role: 'system',
              content: toolCall.name === 'lookup_order_by_id'
                ? `Inform the customer in Vietnamese that the order details are displayed on screen. Briefly mention the order status.${SUGGESTIONS_SUFFIX}`
                : toolCall.name === 'lookup_active_orders'
                  ? `Inform the customer in Vietnamese how many active orders they have, shown on the right side.${SUGGESTIONS_SUFFIX}`
                  : `Inform the customer in Vietnamese about their order history shown on the right side.${SUGGESTIONS_SUFFIX}`
            },
            ...mapMessagesToRoles(state.messages),
            response,
            { role: 'tool', name: toolCall.name, content: toolResultStr, tool_call_id: toolCall.id } as any
          ]);

          const rawContent = typeof finalResponse.content === 'string' ? finalResponse.content : JSON.stringify(finalResponse.content);
          const parsed = parseStructuredResponse(rawContent);
          suggestions = parsed.suggestions;
          finalMessages = [
            response,
            { role: 'tool', name: toolCall.name, content: toolResultStr, tool_call_id: toolCall.id } as any,
            new AIMessage(parsed.text)
          ];

          return { messages: finalMessages, uiEvent: uiEvent || state.uiEvent, suggestions };
        }
      } else {
        const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        const parsed = parseStructuredResponse(rawContent);
        suggestions = parsed.suggestions;
        finalMessages = [new AIMessage(parsed.text)];
      }

      return { messages: finalMessages, uiEvent: uiEvent || state.uiEvent, suggestions };
    } catch (error) {
      console.error('Order tracking error:', error);
      return {
        messages: [new AIMessage("Hệ thống đang gặp sự cố khi tra cứu đơn hàng. Bạn vui lòng thử lại sau nhé.")],
        suggestions: [],
      };
    }
  };
};
