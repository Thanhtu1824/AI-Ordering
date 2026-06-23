import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AiService } from '../ai/ai.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly aiService: AiService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): Promise<void> {
    // Send typing indicator
    client.emit('typing', true);
    
    // Process with AI
    const result = await this.aiService.processMessage(data);
    
    // Send back the AI response
    client.emit('aiResponse', result);
    client.emit('typing', false);
  }
}
