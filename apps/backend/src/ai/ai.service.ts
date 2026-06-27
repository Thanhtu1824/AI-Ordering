import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';

import { AgentState, AgentStateType } from './state/agent.state';
import { createIntentAgent } from './agents/intent.agent';
import { createProductDiscoveryAgent } from './agents/product-discovery.agent';
import { createOrderAgent } from './agents/order.agent';
import { createHumanHandoffAgent } from './agents/human-handoff.agent';
import { createUnknownAgent } from './agents/unknown.agent';
import { createAuthAgent } from './agents/auth.agent';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private model!: ChatGoogleGenerativeAI;
  private app: any;

  constructor(private readonly prisma: PrismaService, private readonly authService: AuthService) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      this.logger.error('GOOGLE_API_KEY is not set. AI features will be unavailable.');
    } else {
      try {
        this.model = new ChatGoogleGenerativeAI({
          model: 'gemini-2.5-flash',
          temperature: 0,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          ],
        });
        this.logger.log('ChatGoogleGenerativeAI initialized successfully.');
      } catch (e) {
        this.logger.error('Failed to initialize ChatGoogleGenerativeAI.', e);
      }
    }

    if (this.model) {
      this.initGraph();
    } else {
      this.logger.warn('LangGraph will not be initialized because the AI model is unavailable.');
    }
  }

  private initGraph() {
    // We explicitly cast to any here to bypass strict Type limitations when building
    const workflow = new StateGraph(AgentState) as any;

    // Initialize the specialized agents
    const intentAgent = createIntentAgent(this.model);
    const productDiscoveryAgent = createProductDiscoveryAgent(this.prisma, this.model);
    const orderAgent = createOrderAgent(this.prisma, this.model);
    const humanHandoffAgent = createHumanHandoffAgent();
    const unknownAgent = createUnknownAgent(this.model);
    const authAgent = createAuthAgent(this.authService, this.model);

    // Add Nodes
    workflow.addNode('detectIntent', intentAgent);
    workflow.addNode('productDiscovery', productDiscoveryAgent);
    workflow.addNode('createOrder', orderAgent);
    workflow.addNode('humanHandoff', humanHandoffAgent);
    workflow.addNode('generalChat', unknownAgent);
    workflow.addNode('auth', authAgent);

    // Define Graph Edges
    // 1. Everything starts at Intent Detection
    workflow.addEdge(START, 'detectIntent');

    // 2. Route based on detected intent
    workflow.addConditionalEdges('detectIntent', (state: AgentStateType) => {
      const intent = state.currentIntent;

      switch (intent) {
        case 'login':
        case 'register':
          return 'auth';
        case 'search_product':
          return 'productDiscovery';
        case 'create_order':
        case 'payment':
          return 'createOrder';
        case 'complaint':
        case 'cancel_request':
          return 'humanHandoff';
        default:
          return 'generalChat';
      }
    });

    // 3. All endpoint nodes go to END
    workflow.addEdge('productDiscovery', END);
    workflow.addEdge('createOrder', END);
    workflow.addEdge('humanHandoff', END);
    workflow.addEdge('generalChat', END);
    workflow.addEdge('auth', END);

    const checkpointer = new MemorySaver();
    this.app = workflow.compile({ checkpointer });
  }

  async processMessage(message: string, sessionId: string = 'default-session', user?: any): Promise<any> {
    if (!this.app) {
      this.logger.error('LangGraph app is not initialized. Check GOOGLE_API_KEY configuration.');
      return {
        text: 'Hệ thống AI chưa được cấu hình. Vui lòng liên hệ quản trị viên để kiểm tra GOOGLE_API_KEY.',
        uiEvent: null,
      };
    }

    try {
      const config = { configurable: { thread_id: sessionId } };

      const systemMessage = user 
        ? new SystemMessage(`The current user is logged in. Their name is ${user.name}, phone: ${user.phone}.`)
        : new SystemMessage(`The current user is a guest and not logged in.`);

      const finalState = await this.app.invoke(
        { messages: [systemMessage, new HumanMessage(message)], currentUser: user },
        config
      );

      const aiMessages = finalState.messages.filter((m: any) => {
        const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
        return type === 'ai';
      });
      const lastAiMessage = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : '';

      return {
        text: lastAiMessage,
        uiEvent: finalState.uiEvent || null,
        suggestions: finalState.suggestions || [],
      };
    } catch (error) {
      this.logger.error('Error processing message in LangGraph', error);
      return {
        text: 'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng kiểm tra lại cấu hình hệ thống.',
        uiEvent: null,
        suggestions: [],
      };
    }
  }
}
