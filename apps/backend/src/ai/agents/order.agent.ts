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
        let totalImportDuty = 0;
        let totalVat = 0;
        let totalShippingFee = 0;
        let isQuote = false;
        const validItems: { product: any; quantity: number }[] = [];

        for (const item of items) {
          const product = await prisma.product.findFirst({
            where: {
              name: { contains: item.productName, mode: 'insensitive' }
            }
          }) as any;

          if (!product) {
            return JSON.stringify({ success: false, message: `Không tìm thấy sản phẩm nào có tên gần giống "${item.productName}". Vui lòng kiểm tra lại.` });
          }

          if (product.requiresQuote || product.price === 0) {
            isQuote = true;
          }

          const itemSubtotal = product.price * item.quantity;
          const weight = product.weight || 0;
          const length = product.length || 0;
          const width = product.width || 0;
          const height = product.height || 0;
          
          const volumetricWeight = (length * width * height) / 5000;
          const appliedWeight = Math.max(weight, volumetricWeight);
          const shippingFee = appliedWeight * 200000 * item.quantity;
          
          const importDuty = itemSubtotal * product.importDutyRate;
          const vat = (itemSubtotal + importDuty) * product.vatRate;

          validItems.push({
            product,
            quantity: item.quantity
          });
          subtotal += itemSubtotal;
          totalShippingFee += shippingFee;
          totalImportDuty += importDuty;
          totalVat += vat;
        }

        const totalAmount = subtotal + totalImportDuty + totalVat + totalShippingFee;

        const result = await prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId,
              totalAmount,
              shippingFee: totalShippingFee,
              importDuty: totalImportDuty,
              tax: totalVat,
              shippingAddress,
              status: isQuote ? ('AWAITING_QUOTE' as any) : ('PENDING' as any),
              paymentMethod: 'CASH_ON_DELIVERY',
              paymentStatus: 'PENDING'
            }
          });

          for (const validItem of validItems) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: validItem.product.id,
                productName: validItem.product.name,
                quantity: validItem.quantity,
                price: validItem.product.price,
              }
            });
          }

          return {
            id: order.id,
            totalAmount,
            shippingFee: totalShippingFee,
            importDuty: totalImportDuty,
            tax: totalVat,
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
        let totalImportDuty = 0;
        let totalVat = 0;
        let totalShippingFee = 0;
        let totalAppliedWeight = 0;
        let isQuote = false;
        
        for (const item of items) {
          const product = await prisma.product.findFirst({
            where: {
              name: { contains: item.productName, mode: 'insensitive' }
            }
          }) as any;
          if (product) {
            if (product.requiresQuote || product.price === 0) {
              isQuote = true;
            }
            const itemSubtotal = product.price * item.quantity;
            
            const weight = product.weight || 0;
            const length = product.length || 0;
            const width = product.width || 0;
            const height = product.height || 0;
            
            const volumetricWeight = (length * width * height) / 5000;
            const appliedWeight = Math.max(weight, volumetricWeight);
            const shippingFee = appliedWeight * 200000 * item.quantity;
            
            const importDuty = itemSubtotal * product.importDutyRate;
            const vat = (itemSubtotal + importDuty) * product.vatRate;
            
            products.push({ 
                ...product, 
                quantity: item.quantity, 
                subtotal: itemSubtotal,
                shippingFee,
                importDuty,
                vat,
                appliedWeight: appliedWeight * item.quantity
            });
            subtotal += itemSubtotal;
            totalShippingFee += shippingFee;
            totalImportDuty += importDuty;
            totalVat += vat;
            totalAppliedWeight += appliedWeight * item.quantity;
          }
        }
        
        const total = subtotal + totalImportDuty + totalVat + totalShippingFee;
        
        return JSON.stringify({ success: true, items: products, subtotal, tax: totalVat, importDuty: totalImportDuty, shippingFee: totalShippingFee, total, isQuote, totalAppliedWeight });
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

  const saveUserAddressTool = tool(
    async ({ address, userId }) => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { address }
        });
        return JSON.stringify({ success: true, message: "Đã lưu địa chỉ vào hồ sơ." });
      } catch (error) {
        return JSON.stringify({ success: false, message: "Lỗi lưu địa chỉ." });
      }
    },
    {
      name: "save_user_address",
      description: "Lưu địa chỉ giao hàng của người dùng vào hồ sơ NGAY LẬP TỨC khi họ vừa cung cấp địa chỉ.",
      schema: z.object({
        address: z.string().describe("Địa chỉ giao hàng chi tiết"),
        userId: z.string().describe("ID của người dùng hiện tại"),
      }),
    }
  );

  const modelsWithTools = models.map(m => m.bindTools([createOrderTool, previewOrderTool, saveUserAddressTool]));
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
      // Lấy thông tin user từ DB để biết họ đã có địa chỉ chưa
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      const userAddress = dbUser?.address;

      const focusedProduct = state.focusedEntity;
      const hasFocused = focusedProduct != null && (Array.isArray(focusedProduct) ? focusedProduct.length > 0 : true);
      console.log('[OrderAgent] focusedEntity:', JSON.stringify(focusedProduct));
      console.log('[OrderAgent] viewedProducts:', JSON.stringify(state.viewedProducts));

      const response = await runnable.invoke([
        {
          role: 'system',
          content: `Bạn là trợ lý đặt hàng từ nước ngoài. ID của khách hàng hiện tại là ${userId}.
${userAddress ? `\nĐỊA CHỈ GIAO HÀNG ĐÃ LƯU: "${userAddress}".\n=> KHÁCH ĐÃ CÓ ĐỊA CHỈ. Bạn KHÔNG cần hỏi lại địa chỉ nữa. Khi khách xác nhận đặt hàng, hãy gọi tool \`create_order\` và truyền địa chỉ này vào.` : '\n=> KHÁCH CHƯA CÓ ĐỊA CHỈ. Bạn phải yêu cầu khách cung cấp địa chỉ chi tiết trước khi đặt hàng.'}
${hasFocused
  ? `CONTEXT - SẢN PHẨM ĐANG ĐƯỢC XEM TRÊN MÀN HÌNH:\n${JSON.stringify(Array.isArray(focusedProduct) ? focusedProduct : [focusedProduct], null, 2)}\n`
  : ''}
Nhiệm vụ của bạn là gom danh sách các món hàng (tên và số lượng) và địa chỉ giao hàng mà khách yêu cầu.
QUAN TRỌNG NHẤT: Đây là hàng order, KHÔNG BAO GIỜ báo "hết hàng".

QUY TẮC XỬ LÝ GIỎ HÀNG:
1. Nếu khách nói "thêm vào giỏ hàng" / "mua cái này" / "đặt cái đó" mà KHÔNG nói tên cụ thể:
   - Nếu có SẢN PHẨM ĐANG ĐƯỢC XEM (CONTEXT ở trên), hãy sử dụng ngay tên sản phẩm đó và hỏi "Bạn muốn đặt bao nhiêu cái [tên sản phẩm] ạ?"
   - Nếu KHÔNG có sản phẩm nào đang xem, hỏi "Bạn muốn đặt sản phẩm nào ạ?"
2. Nếu khách nói "thêm 2 cái" / "lấy 3 cái" / "cho tôi 2" mà KHÔNG nói tên:
   - Sử dụng SẢN PHẨM ĐANG ĐƯỢC XEM (CONTEXT) + số lượng khách vừa nói, gọi ngay preview_order
3. Nếu khách nói cả tên VÀ số lượng (vd: "thêm 2 cái laptop"): gọi preview_order ngay
4. Nếu khách nói nhiều sản phẩm (vd: "1 laptop và 2 chuột"): gọi preview_order với cả danh sách trong 1 lần gọi

TUYỆT ĐỐI KHÔNG gọi create_order ngay. Phải gọi preview_order trước.
KHI KHÁCH CUNG CẤP ĐỊA CHỈ GIAO HÀNG: Gọi tool save_user_address ngay lập tức.
Sau khi preview_order, hỏi xác nhận. Chỉ gọi create_order khi khách ĐỒNG Ý / XÁC NHẬN.
Luôn truyền ${userId} vào tham số userId của tool.${SUGGESTIONS_SUFFIX}`
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
          if (toolCall.name === 'create_order' || toolCall.name === 'preview_order' || toolCall.name === 'save_user_address') {
            let rawToolResult: any;
            if (toolCall.name === 'create_order') {
              rawToolResult = await createOrderTool.invoke(toolCall);
            } else if (toolCall.name === 'preview_order') {
              rawToolResult = await previewOrderTool.invoke(toolCall);
            } else {
              rawToolResult = await saveUserAddressTool.invoke(toolCall);
            }
            
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
                  ? `Report the order result to the customer in Vietnamese.
If successful:
- The order ID is long (UUID format). ALWAYS shorten it to only the first 8 uppercase characters prefixed with '#'. Example: if id is '8fe9b653-29a9-45c2-baa5-3a55916361d8', show '#8FE9B653'.
- If parsedResult.isQuote is true (order requires quote): MUST inform the customer that their request has been recorded (show the short order ID) and you are IMMEDIATELY transferring this conversation to a sales consultant to discuss pricing directly.
- If it is a normal order: Confirm the order has been placed successfully and show the short order ID.
If failed: Explain the reason (e.g. product not found).${SUGGESTIONS_SUFFIX}`
                  : toolCall.name === 'save_user_address'
                    ? `Confirm to the customer in Vietnamese that you have saved their shipping address successfully. Ask if they would like to proceed with placing the order.${SUGGESTIONS_SUFFIX}`
                    : `Inform the customer in Vietnamese that you have added the item(s) to their cart and displayed the detailed cost breakdown (including shipping and taxes) on the screen. Ask them to confirm if they want to proceed with the order.${SUGGESTIONS_SUFFIX}`
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
