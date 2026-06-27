import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { parseStructuredResponse, mapMessagesToRoles, SUGGESTIONS_SUFFIX } from './agent.utils';

export const createOrderAgent = (prisma: PrismaService, models: ChatGoogleGenerativeAI[]) => {
  const createOrderTool = tool(
    async ({ items, shippingAddress, userId }) => {
      try {
        let subtotal = 0;
        let isQuote = false;
        const validItems: { product: any; quantity: number }[] = [];

        for (const item of items) {
          const product = await prisma.product.findFirst({
            where: {
              name: { contains: item.productName, mode: 'insensitive' }
            }
          });

          if (!product) {
            return JSON.stringify({ success: false, message: `Không tìm thấy sản phẩm nào có tên gần giống "${item.productName}". Vui lòng kiểm tra lại.` });
          }

          if (product.requiresQuote || product.price === 0) {
            isQuote = true;
          }

          validItems.push({
            product,
            quantity: item.quantity
          });
          subtotal += product.price * item.quantity;
        }

        const tax = subtotal * 0.1; // Thuế 10%
        const shippingFee = 50000; // Phí ship mặc định 50k
        const totalAmount = subtotal + tax + shippingFee;

        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId,
              totalAmount,
              shippingFee,
              tax,
              shippingAddress,
              status: isQuote ? 'AWAITING_QUOTE' : 'PENDING',
              paymentMethod: 'CASH_ON_DELIVERY',
              paymentStatus: 'PENDING'
            }
          });

          for (const validItem of validItems) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: validItem.product.id,
                quantity: validItem.quantity,
                price: validItem.product.price,
              }
            });
          }

          return {
            id: order.id,
            totalAmount,
            shippingFee,
            tax,
            isQuote,
            items: validItems.map(vi => ({
              productName: vi.product.name,
              quantity: vi.quantity,
              price: vi.product.price
            })),
            shippingAddress
          };
        });

        return JSON.stringify({ success: true, order: result });
      } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        return JSON.stringify({ success: false, message: "Lỗi hệ thống khi tạo đơn hàng." });
      }
    },
    {
      name: "create_order",
      description: "Tạo đơn hàng hoặc yêu cầu báo giá mới trong hệ thống. Gọi khi khách hàng đã ĐỒNG Ý XÁC NHẬN đơn hoặc yêu cầu báo giá.",
      schema: z.object({
        items: z.array(z.object({
          productName: z.string().describe("Tên sản phẩm khách hàng muốn mua"),
          quantity: z.number().describe("Số lượng của sản phẩm này (số nguyên > 0)"),
        })).describe("Danh sách các sản phẩm và số lượng tương ứng"),
        shippingAddress: z.string().describe("Địa chỉ giao hàng chi tiết"),
        userId: z.string().describe("ID của người dùng hiện tại"),
      }),
    }
  );

  const previewOrderTool = tool(
    async ({ items }) => {
      try {
        const products = [];
        let subtotal = 0;
        let isQuote = false;
        
        for (const item of items) {
          const product = await prisma.product.findFirst({
            where: {
              name: { contains: item.productName, mode: 'insensitive' }
            }
          });
          if (product) {
            if (product.requiresQuote || product.price === 0) {
              isQuote = true;
            }
            const itemSubtotal = product.price * item.quantity;
            products.push({ ...product, quantity: item.quantity, subtotal: itemSubtotal });
            subtotal += itemSubtotal;
          }
        }
        
        const tax = subtotal * 0.1;
        const shippingFee = 50000;
        const total = subtotal + tax + shippingFee;
        
        return JSON.stringify({ success: true, items: products, subtotal, tax, shippingFee, total, isQuote });
      } catch (error) {
        return JSON.stringify({ success: false });
      }
    },
    {
      name: "preview_order",
      description: "Hiển thị danh sách sản phẩm lên màn hình cho khách xem và xác nhận.",
      schema: z.object({
        items: z.array(z.object({
          productName: z.string().describe("Tên sản phẩm khách hàng muốn mua"),
          quantity: z.number().describe("Số lượng của sản phẩm này (số nguyên > 0)")
        })).describe("Danh sách các sản phẩm cần tra cứu và hiển thị"),
      }),
    }
  );

  const modelsWithTools = models.map(m => m.bindTools([createOrderTool, previewOrderTool]));
  const runnable = modelsWithTools.length > 1
    ? modelsWithTools[0].withFallbacks({ fallbacks: modelsWithTools.slice(1) })
    : modelsWithTools[0];

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    if (!state.currentUser || !state.currentUser.sub) {
      return {
        messages: [new AIMessage("Để đặt hàng, bạn cần đăng nhập trước nhé. Vui lòng cho tôi biết số điện thoại và mật khẩu để tôi đăng nhập giúp bạn.")],
        currentIntent: 'login'
      };
    }

    const userId = state.currentUser.sub;

    try {
      const response = await runnable.invoke([
        {
          role: 'system',
          content: `Bạn là trợ lý đặt hàng từ nước ngoài. ID của khách hàng hiện tại là ${userId}.
Nhiệm vụ của bạn là gom danh sách các món hàng (tên và số lượng) và địa chỉ giao hàng mà khách yêu cầu.
QUAN TRỌNG NHẤT: Đây là hàng order, KHÔNG BAO GIỜ báo "hết hàng". Dù không thấy số lượng tồn kho, luôn nói khách có thể đặt được.
QUAN TRỌNG: TUYỆT ĐỐI KHÔNG gọi tool create_order ngay. Khi khách yêu cầu mua hàng, bạn PHẢI gọi tool preview_order để tra cứu thông tin và hiển thị sản phẩm lên màn hình.
Sau khi gọi preview_order:
- Nếu là đơn hàng bình thường, hỏi "Bạn có xác nhận đặt đơn hàng này không?".
- Nếu là đơn hàng báo giá, hỏi "Đơn hàng này cần liên hệ báo giá, bạn có muốn gửi yêu cầu không?".
Chỉ khi nào khách hàng chat ĐỒNG Ý / XÁC NHẬN, bạn mới được phép gọi tool create_order.
Lưu ý: Luôn truyền ${userId} vào tham số userId của tool.${SUGGESTIONS_SUFFIX}`
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
          if (toolCall.name === 'create_order' || toolCall.name === 'preview_order') {
            const rawToolResult: any = await (toolCall.name === 'create_order' ? createOrderTool.invoke(toolCall) : previewOrderTool.invoke(toolCall));
            const toolResultStr = typeof rawToolResult === 'string' ? rawToolResult : (rawToolResult.content || JSON.stringify(rawToolResult));
            
            const parsedResult = JSON.parse(toolResultStr);

            if (toolCall.name === 'create_order' && parsedResult.success) {
              uiEvent = { type: 'ORDER_CONFIRMATION', data: parsedResult.order };
            } else if (toolCall.name === 'preview_order' && parsedResult.success && parsedResult.items.length > 0) {
              uiEvent = { type: 'CART', data: parsedResult };
            }

            const finalResponse = await runnable.invoke([
              {
                role: 'system',
                content: toolCall.name === 'create_order'
                  ? `Thông báo kết quả đặt hàng cho người dùng. Nếu thành công, hãy nói đơn hàng đã được ghi nhận và hiển thị trên màn hình. Nếu thất bại, giải thích lý do (như không tìm thấy sản phẩm).${SUGGESTIONS_SUFFIX}`
                  : `Thông báo rằng bạn đã hiển thị thông tin chi tiết các sản phẩm lên màn hình để khách tham khảo. Nhắc khách xem và xác nhận nếu muốn chốt đơn.${SUGGESTIONS_SUFFIX}`
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
            const parsed = parseStructuredResponse(rawContent);
            suggestions = parsed.suggestions;
            
            finalMessages = [response, { role: 'tool', name: toolCall.name, content: toolResultStr, tool_call_id: toolCall.id } as any, new AIMessage(parsed.text)];

            return {
              messages: finalMessages,
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
        uiEvent: uiEvent || state.uiEvent,
        suggestions,
      };
    } catch (error) {
      console.error('Order agent error:', error);
      return {
        messages: [new AIMessage("Hệ thống đang gặp sự cố khi xử lý đơn hàng. Bạn vui lòng thử lại sau nhé.")],
        suggestions: [],
      };
    }
  };
};
