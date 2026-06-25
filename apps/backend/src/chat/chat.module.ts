import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AiModule, AuthModule],
  providers: [ChatGateway],
})
export class ChatModule {}
