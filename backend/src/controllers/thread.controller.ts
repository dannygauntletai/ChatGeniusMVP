import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/request.types';
import { ThreadService } from '../services/thread.service';
import { io } from '../app';

export class ThreadController {
  static async createThreadMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, parentMessageId } = req.body;
      const userId = (req as AuthRequest).user.id;

      const threadMessage = await ThreadService.createThreadMessage({
        content,
        parentMessageId,
        userId,
      });

      io.to(threadMessage.channelId).emit('thread:message_created', threadMessage);
      return res.status(201).json(threadMessage);
    } catch (error) {
      return next(error);
    }
  }

  static async getThreadMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { parentMessageId } = req.params;
      const messages = await ThreadService.getThreadMessages(parentMessageId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  static async updateThreadMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { content } = req.body;
      const userId = (req as AuthRequest).user.id;

      const message = await ThreadService.updateThreadMessage(messageId, userId, { content });
      
      io.to(message.channelId).emit('thread:message_updated', message);
      res.json(message);
    } catch (error) {
      next(error);
    }
  }
} 