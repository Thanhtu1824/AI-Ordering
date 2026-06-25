import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
