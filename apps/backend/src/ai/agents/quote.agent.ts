import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';

export const createQuoteAgent = () => {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    // In a real scenario, we calculate this based on the user's cart or focused entities.
    // For now, we mock the exact UI Event structure required by the generative UI.
    const uiEvent = {
      type: 'QUOTE',
      data: {
        quote_id: "Q-" + Math.floor(Math.random() * 1000),
        items: [
          { name: "Sản phẩm Demo 1", quantity: 10, unit_price: 200000 },
          { name: "Sản phẩm Demo 2", quantity: 5, unit_price: 100000 }
        ],
        items_total: 2500000,
        shipping_fee: 50000,
        tax: 250000,
        grand_total: 2800000,
        currency: "VND",
        valid_until: "31/12/2026"
      }
    };
    
    return {
      messages: [new AIMessage("Tôi đã tạo bảng báo giá chi tiết cho bạn. Vui lòng kiểm tra trên màn hình nhé!")],
      uiEvent
    };
  };
};
