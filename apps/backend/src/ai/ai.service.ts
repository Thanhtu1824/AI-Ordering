import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async processMessage(message: string): Promise<any> {
    const textLower = message.toLowerCase();
    
    if (textLower.includes('báo giá') || textLower.includes('quote')) {
      return {
        text: 'Đây là báo giá chi tiết mà bạn yêu cầu. Vui lòng kiểm tra thông tin ở khung bên phải nhé!',
        uiEvent: {
          type: 'QUOTE',
          data: {
            quote_id: "Q-999",
            items: [
              { name: "Áo thun đồng phục", quantity: 50, unit_price: 150000 },
              { name: "Nón lưỡi trai", quantity: 50, unit_price: 45000 }
            ],
            items_total: 9750000,
            shipping_fee: 50000,
            tax: 975000,
            grand_total: 10775000,
            currency: "VND",
            valid_until: "30/06/2026"
          }
        }
      };
    }

    return {
      text: `Echo từ AI: "${message}". Gõ "báo giá" để xem giao diện Generative UI!`,
      uiEvent: null
    };
  }
}
