import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from '../ai/ai.service';
import { AuthService } from '../auth/auth.service';
import Redis from 'ioredis';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;
  
  private redis: Redis;

  constructor(private readonly aiService: AiService, private readonly authService: AuthService) {
    // Connect to Redis via REDIS_URL env variable (Upstash or local)
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    } else {
      this.redis = new Redis({ host: 'localhost', port: 6379 });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() payload: { text: string; token?: string } | string, @ConnectedSocket() client: Socket): Promise<void> {
    const data = typeof payload === 'string' ? payload : payload.text;
    const token = typeof payload === 'object' ? payload.token : undefined;

    // 0. Payload Limit
    if (data.length > 500) {
      client.emit('aiResponse', { 
        text: 'Tin nhắn quá dài. Vui lòng gửi nội dung dưới 500 ký tự.', 
        uiEvent: null 
      });
      return;
    }

    // 1. Normalize Input (Strip meaningless special characters to prevent prompt injection)
    // Keeps alphanumeric, spaces, Vietnamese characters, and common punctuation including /: for URLs
    const normalizedData = data.replace(/[^\w\s\u00C0-\u1EF9.,?!\-"'%<>/:]/gi, '');
    // 1. Rate Limiting using Redis (5 messages per minute per IP)
    const ip = client.handshake.address || client.id;
    const rateLimitKey = `ratelimit:${ip}`;
    
    try {
      const currentCount = await this.redis.incr(rateLimitKey);
      if (currentCount === 1) {
        // Set expiry for 60 seconds on the first message
        await this.redis.expire(rateLimitKey, 60);
      }
      
      if (currentCount > 5) {
        client.emit('rateLimit', { cooldownMs: 60000 });
        client.emit('aiResponse', { 
          text: 'Bạn đang thao tác quá nhanh, vui lòng đợi 60 giây', 
          uiEvent: null 
        });
        return; // Block request
      }
    } catch (error) {
      console.error('Redis Rate Limit Error:', error);
      // Proceed if Redis fails to avoid blocking legitimate users completely
    }

    // 2. URL Filtering Regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = normalizedData.match(urlRegex);
    if (urls) {
      const hasInvalidUrl = urls.some(url => !url.includes('yourdomain.com'));
      if (hasInvalidUrl) {
        client.emit('aiResponse', { 
          text: 'Xin lỗi, để đảm bảo an toàn bảo mật, tôi chỉ có thể hỗ trợ các liên kết sản phẩm thuộc hệ thống của chúng tôi.', 
          uiEvent: null 
        });
        return; // Block request
      }
    }

    // Verify token if provided
    let user = null;
    if (token) {
      user = this.authService.verifyToken(token);
    }

    // Send typing indicator
    client.emit('typing', true);
    
    // Process with AI – use userId as sessionId (persistent) or client.id for guests
    const sessionId = user?.sub ? `user-${user.sub}` : `guest-${client.id}`;
    const result = await this.aiService.processMessage(normalizedData, sessionId, user);
    
    // Send back the AI response
    client.emit('aiResponse', result);
    client.emit('typing', false);
  }
}
