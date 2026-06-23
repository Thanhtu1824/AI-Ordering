import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';

import { AgentState, AgentStateType } from './state/agent.state';
import { createIntentAgent } from './agents/intent.agent';
import { createProductDiscoveryAgent } from './agents/product-discovery.agent';
import { createQuoteAgent } from './agents/quote.agent';
import { createHumanHandoffAgent } from './agents/human-handoff.agent';
import { createUnknownAgent } from './agents/unknown.agent';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private model!: ChatGoogleGenerativeAI;
  private app: any;

  constructor(private readonly prisma: PrismaService) {
    try {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.5-flash',
        temperature: 0,
      });
    } catch (e) {
      this.logger.warn('Failed to initialize ChatGoogleGenerativeAI. Is GOOGLE_API_KEY set?');
    }

    this.initGraph();
  }

  private initGraph() {
    // We explicitly cast to any here to bypass strict Type limitations when building
    const workflow = new StateGraph(AgentState) as any;

    // Initialize the specialized agents
    const intentAgent = createIntentAgent(this.model);
    const productDiscoveryAgent = createProductDiscoveryAgent(this.prisma, this.model);
    const quoteAgent = createQuoteAgent();
    const humanHandoffAgent = createHumanHandoffAgent();
    const unknownAgent = createUnknownAgent(this.model);

    // Add Nodes
    workflow.addNode('detectIntent', intentAgent);
    workflow.addNode('productDiscovery', productDiscoveryAgent);
    workflow.addNode('generateQuote', quoteAgent);
    workflow.addNode('humanHandoff', humanHandoffAgent);
    workflow.addNode('generalChat', unknownAgent);

    // Define Graph Edges
    // 1. Everything starts at Intent Detection
    workflow.addEdge(START, 'detectIntent');
    
    // 2. Route based on detected intent
    workflow.addConditionalEdges('detectIntent', (state: AgentStateType) => {
      const intent = state.currentIntent;
      
      switch (intent) {
        case 'search_product':
          return 'productDiscovery';
        case 'create_order':
        case 'payment':
          // We map these to quote for now as a stepping stone
          return 'generateQuote';
        case 'complaint':
        case 'cancel_request':
          return 'humanHandoff';
        default:
          return 'generalChat';
      }
    });

    // 3. All endpoint nodes go to END
    workflow.addEdge('productDiscovery', END);
    workflow.addEdge('generateQuote', END);
    workflow.addEdge('humanHandoff', END);
    workflow.addEdge('generalChat', END);

    const checkpointer = new MemorySaver();
    this.app = workflow.compile({ checkpointer });
  }

  async processMessage(message: string, sessionId: string = 'default-session'): Promise<any> {
    try {
      const config = { configurable: { thread_id: sessionId } };
      
      const finalState = await this.app.invoke(
        { messages: [new HumanMessage(message)] },
        config
      );

      const aiMessages = finalState.messages.filter((m: any) => {
        const type = m.getType ? m.getType() : (m._getType ? m._getType() : m.type);
        return type === 'ai';
      });
      const lastAiMessage = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].content : '';

      return {
        text: lastAiMessage,
        uiEvent: finalState.uiEvent || null
      };
    } catch (error) {
      this.logger.error('Error processing message in LangGraph', error);
      return {
        text: 'Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng kiểm tra lại cấu hình hệ thống.',
        uiEvent: null
      };
    }
  }
}
