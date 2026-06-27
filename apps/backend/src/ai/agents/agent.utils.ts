import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage } from '@langchain/core/messages';

const SUGGESTIONS_SUFFIX = `

---
Cuối mỗi phản hồi, hãy thêm một dòng bắt đầu bằng "|||SUGGESTIONS:" và theo sau là một JSON array chứa 2-3 gợi ý ngắn (mỗi gợi ý tối đa 8 từ, bằng tiếng Việt) mà người dùng có thể muốn làm tiếp theo, dựa trên ngữ cảnh cuộc hội thoại và các chức năng của hệ thống (tìm sản phẩm, đặt hàng, đăng nhập...).
Ví dụ: |||SUGGESTIONS:["Đặt hàng ngay", "Xem thêm sản phẩm", "Kiểm tra đơn hàng"]|||`;

/**
 * Extracts the visible text and suggestions from a raw AI response string.
 * The model is expected to append: |||SUGGESTIONS:[...]|||
 */
export function parseStructuredResponse(raw: string): { text: string; suggestions: string[] } {
  const marker = '|||SUGGESTIONS:';
  const idx = raw.lastIndexOf(marker);

  if (idx === -1) {
    return { text: raw.trim(), suggestions: [] };
  }

  const text = raw.substring(0, idx).trim().replace(/---\s*$/, '').trim();
  const rest = raw.substring(idx + marker.length);
  const endIdx = rest.lastIndexOf('|||');

  if (endIdx === -1) {
    return { text, suggestions: [] };
  }

  try {
    const jsonStr = rest.substring(0, endIdx);
    const suggestions = JSON.parse(jsonStr);
    return { text, suggestions: Array.isArray(suggestions) ? suggestions : [] };
  } catch {
    return { text, suggestions: [] };
  }
}

/**
 * Map conversation messages to the format expected by the model.
 */
export function mapMessagesToRoles(messages: BaseMessage[]): Array<{ role: string; content: string }> {
  return messages
    .filter((m: any) => {
      const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
      return type !== 'system'; // System message is handled separately in each agent
    })
    .map((m: any) => {
      const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
      return {
        role: type === 'human' || type === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      };
    });
}

export { SUGGESTIONS_SUFFIX };
