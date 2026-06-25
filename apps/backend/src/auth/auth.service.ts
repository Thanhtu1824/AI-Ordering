import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'ai-ordering-secret-key-2026';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerUser(name: string, phone: string, passwordRaw: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return { success: false, message: 'Số điện thoại này đã được đăng ký.' };
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(passwordRaw, saltRounds);

      const user = await this.prisma.user.create({
        data: {
          name,
          phone,
          passwordHash,
        },
      });

      const token = jwt.sign({ sub: user.id, phone: user.phone, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return {
        success: true,
        message: `Đăng ký thành công. Chào mừng ${user.name}!`,
        token,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
      };
    } catch (error) {
      this.logger.error('Registration error', error);
      return { success: false, message: 'Lỗi hệ thống khi đăng ký.' };
    }
  }

  async loginUser(phone: string, passwordRaw: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (!user || !user.passwordHash) {
        return { success: false, message: 'Sai số điện thoại hoặc mật khẩu.' };
      }

      const isMatch = await bcrypt.compare(passwordRaw, user.passwordHash);
      if (!isMatch) {
        return { success: false, message: 'Sai số điện thoại hoặc mật khẩu.' };
      }

      const token = jwt.sign({ sub: user.id, phone: user.phone, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

      return {
        success: true,
        message: `Đăng nhập thành công. Chào mừng ${user.name} trở lại!`,
        token,
        user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
      };
    } catch (error) {
      this.logger.error('Login error', error);
      return { success: false, message: 'Lỗi hệ thống khi đăng nhập.' };
    }
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  }
}
