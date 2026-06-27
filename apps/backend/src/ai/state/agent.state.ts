import { Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';

// Define the valid intents based on business-logic.md
export type Intent =
  | 'login'
  | 'register'
  | 'search_product'
  | 'view_detail'
  | 'create_order'
  | 'payment'
  | 'view_order'
  | 'cancel_request'
  | 'complaint'
  | 'unknown';

// Define the state structure for the Multi-Agent system
export const AgentState = Annotation.Root({
  // The conversation history
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),

  // The currently detected intent from the user
  currentIntent: Annotation<Intent>({
    reducer: (x, y) => y ?? x,
    default: () => 'unknown',
  }),

  // Track the current workflow step
  currentWorkflow: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'idle',
  }),

  // Track any entities extracted from the conversation (e.g. searching for a specific product name)
  focusedEntity: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),

  // The Generative UI payload to send back to the frontend
  uiEvent: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  // The currently authenticated user
  currentUser: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),

  // Follow-up suggestions generated with the final response
  suggestions: Annotation<string[]>({
    reducer: (x, y) => (y && y.length > 0 ? y : x),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;
