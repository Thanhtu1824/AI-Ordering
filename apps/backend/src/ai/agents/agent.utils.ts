import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage } from '@langchain/core/messages';

const SUGGESTIONS_SUFFIX = `

---
At the end of every response, append a line starting with "|||SUGGESTIONS:" followed by a JSON array of 2-3 short suggestions (max 8 words each, in Vietnamese) that the user might want to do next, based on the conversation context and system features (find products, place order, login...).
Example: |||SUGGESTIONS:["Dat hang ngay", "Xem them san pham", "Kiem tra don hang"]|||`;

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
      if (type === 'system') return false;
      // Skip AI messages that are pure tool calls (content is array of functionCall objects)
      if ((type === 'ai' || type === 'assistant') && Array.isArray(m.content)) {
        const hasOnlyToolCalls = m.content.every((c: any) =>
          c.type === 'functionCall' || c.type === 'tool_use' || c.type === 'tool_call'
        );
        if (hasOnlyToolCalls) return false;
      }
      return true;
    })
    .map((m: any) => {
      const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
      let content = m.content;
      // If content is an array, extract only text parts
      if (Array.isArray(content)) {
        const textParts = content.filter((c: any) => c.type === 'text').map((c: any) => c.text);
        content = textParts.join('\n').trim();
        if (!content) return null;
      }
      return {
        role: type === 'human' || type === 'user' ? 'user' : 'assistant',
        content: typeof content === 'string' ? content : JSON.stringify(content),
      };
    })
    .filter(Boolean) as Array<{ role: string; content: string }>;
}

export { SUGGESTIONS_SUFFIX };
