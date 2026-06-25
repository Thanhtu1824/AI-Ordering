import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from '../state/agent.state';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AuthService } from '../../auth/auth.service';

export const createAuthAgent = (authService: AuthService, model: ChatGoogleGenerativeAI) => {
  const registerTool = tool(
    async ({ name, phone, password }) => {
      const result = await authService.registerUser(name, phone, password);
      return JSON.stringify(result);
    },
    {
      name: "register_user",
      description: "Registers a new user in the system. Use this when the user wants to create an account and has provided their name, phone, and password.",
      schema: z.object({
        name: z.string().describe("Tên của người dùng"),
        phone: z.string().describe("Số điện thoại của người dùng"),
        password: z.string().describe("Mật khẩu người dùng muốn đặt"),
      }),
    }
  );

  const loginTool = tool(
    async ({ phone, password }) => {
      const result = await authService.loginUser(phone, password);
      return JSON.stringify(result);
    },
    {
      name: "login_user",
      description: "Logs a user into the system. Use this when the user wants to log in and has provided their phone and password.",
      schema: z.object({
        phone: z.string().describe("Số điện thoại của người dùng"),
        password: z.string().describe("Mật khẩu của người dùng"),
      }),
    }
  );

  const modelWithTools = model.bindTools([registerTool, loginTool]);

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    try {
      const response = await modelWithTools.invoke([
        {
          role: 'system',
          content: `You are an Authentication Agent. 
If the user's intent is to register (Đăng ký), you must ask for their name, phone, and password. 
If their intent is to log in (Đăng nhập), you must ask for their phone and password.
Only call the register or login tool once you have ALL the required information. 
If you do not have the required information, ask the user politely for the missing fields in Vietnamese.
Do not make up fake details.`
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
      let uiEvent: any = null;

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
          if (toolCall.name === 'register_user' || toolCall.name === 'login_user') {
            const rawToolResult: any = await (toolCall.name === 'register_user' ? registerTool.invoke(toolCall) : loginTool.invoke(toolCall));
            const toolResultStr = typeof rawToolResult === 'string' ? rawToolResult : (rawToolResult.content || JSON.stringify(rawToolResult));
            
            const parsedResult = JSON.parse(toolResultStr);

            if (parsedResult.success) {
              uiEvent = { type: 'AUTH_SUCCESS', data: { token: parsedResult.token, user: parsedResult.user } };
            }

            const finalResponse = await model.invoke([
              {
                role: 'system',
                content: `Explain the tool result to the user naturally in Vietnamese. If successful, welcome them. If failed, explain why.`
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
          }
        }
      }

      return {
        messages: finalMessages,
        uiEvent: uiEvent || state.uiEvent
      };
    } catch (error) {
      console.error('Auth agent error:', error);
      return {
        messages: [new AIMessage("Hệ thống đang gặp sự cố khi xử lý xác thực. Bạn vui lòng thử lại sau nhé.")],
      };
    }
  };
};
