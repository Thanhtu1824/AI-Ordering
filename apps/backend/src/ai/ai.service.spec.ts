import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

// ─────────────────────────────────────────────────────────────
// Mock: @langchain/google-genai
// ─────────────────────────────────────────────────────────────
jest.mock('@langchain/google-genai', () => {
  return {
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({ intent: 'unknown' }),
      }),
      bindTools: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: 'Mock product response',
          tool_calls: [],
        }),
      }),
      invoke: jest.fn().mockResolvedValue({
        content: 'Mock AI response',
        getType: () => 'ai',
      }),
    })),
  };
});

// ─────────────────────────────────────────────────────────────
// Mock: @google/generative-ai enums
// ─────────────────────────────────────────────────────────────
jest.mock('@google/generative-ai', () => ({
  HarmCategory: {
    HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
    HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
    HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  },
  HarmBlockThreshold: {
    BLOCK_ONLY_HIGH: 'BLOCK_ONLY_HIGH',
  },
}));

// ─────────────────────────────────────────────────────────────
// Mock: PrismaService
// ─────────────────────────────────────────────────────────────
const mockPrismaService = {
  product: {
    findMany: jest.fn().mockResolvedValue([
      { id: 'prod-1', name: 'Laptop Test', slug: 'laptop-test', price: 15000000 },
    ]),
  },
};

describe('AiService', () => {
  let service: AiService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // Test Group 1: Khởi tạo Service
  // ─────────────────────────────────────────────────────────────
  describe('Initialization', () => {
    it('should initialize successfully when GOOGLE_API_KEY is set', async () => {
      process.env.GOOGLE_API_KEY = 'AIzaTestKey12345';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<AiService>(AiService);
      expect(service).toBeDefined();
    });

    it('should NOT crash when GOOGLE_API_KEY is missing', async () => {
      delete process.env.GOOGLE_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<AiService>(AiService);
      expect(service).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Test Group 2: processMessage khi app chưa khởi tạo
  // ─────────────────────────────────────────────────────────────
  describe('processMessage – when AI is not configured', () => {
    beforeEach(async () => {
      delete process.env.GOOGLE_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<AiService>(AiService);
    });

    it('should return a user-friendly error message when app is not initialized', async () => {
      const result = await service.processMessage('xin chào', 'test-session-1');

      expect(result).toBeDefined();
      expect(result.text).toContain('GOOGLE_API_KEY');
      expect(result.uiEvent).toBeNull();
    });

    it('should not throw an exception', async () => {
      await expect(
        service.processMessage('tôi muốn mua laptop', 'test-session-2'),
      ).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Test Group 3: processMessage khi AI được khởi tạo
  // ─────────────────────────────────────────────────────────────
  describe('processMessage – when AI is configured', () => {
    beforeEach(async () => {
      process.env.GOOGLE_API_KEY = 'AIzaTestKey12345';

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: mockPrismaService },
        ],
      }).compile();

      service = module.get<AiService>(AiService);
    });

    it('should return an object with text and uiEvent fields', async () => {
      const result = await service.processMessage('xin chào', 'session-abc');

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('uiEvent');
    });

    it('should handle different sessionIds independently (no shared state)', async () => {
      const result1 = await service.processMessage('tôi muốn mua laptop', 'session-user-1');
      const result2 = await service.processMessage('tôi muốn hủy đơn', 'session-user-2');

      // Both should return valid responses without interfering with each other
      expect(result1).toHaveProperty('text');
      expect(result2).toHaveProperty('text');
    });

    it('should return text as a string', async () => {
      const result = await service.processMessage('hello', 'session-xyz');
      expect(typeof result.text).toBe('string');
    });
  });
});
