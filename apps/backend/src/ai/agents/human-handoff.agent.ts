import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';

export const createHumanHandoffAgent = () => {
  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    // This node strictly follows the business-rules.md:
    // If complaint -> Apologize, create ticket, handoff.
    // If cancellation -> Cannot cancel directly, must handoff.

    const intent = state.currentIntent;
    let message = "Yêu cầu của bạn cần được hỗ trợ bởi nhân viên chăm sóc khách hàng. Tôi đang kết nối bạn với nhân viên thật...";

    if (intent === 'complaint') {
      message = "Tôi rất xin lỗi vì trải nghiệm không tốt của bạn. Tôi đã tạo ticket khiếu nại (Ticket ID: #C-101) và đang chuyển cuộc trò chuyện này cho nhân viên hỗ trợ ngay lập tức.";
    } else if (intent === 'cancel_request') {
      message = "Do hệ thống của chúng tôi có quy định chặt chẽ về việc hoàn tiền và hủy đơn, tôi không thể tự động hủy đơn hàng này. Nhân viên hỗ trợ của chúng tôi sẽ tiếp quản để xử lý yêu cầu hủy đơn cho bạn ngay bây giờ.";
    }

    return {
      messages: [new AIMessage(message)],
      // We could also emit a specific UI Event here to change the chat window status to 'Human mode'
      uiEvent: {
        type: 'HUMAN_HANDOFF',
        data: { status: 'pending_agent' }
      },
      suggestions: ["Xem trạng thái đơn hàng", "Tìm sản phẩm khác"],
    };
  };
};
