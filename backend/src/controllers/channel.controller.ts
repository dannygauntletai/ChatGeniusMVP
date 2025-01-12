import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export class ChannelController {
  static async createChannel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, isPrivate } = req.body;
      const userId = req.auth.userId;

      const channel = await prisma.channel.create({
        data: {
          name,
          isPrivate: isPrivate || false,
          owner: {
            connect: { id: userId }
          },
          members: {
            connect: { id: userId }
          }
        },
        include: {
          members: true,
          owner: true
        }
      });

      const channelWithMemberCount = {
        ...channel,
        memberCount: channel.members.length
      };

      io.emit('channel:created', channelWithMemberCount);
      res.status(201).json(channelWithMemberCount);
    } catch (error) {
      next(error);
    }
  }

  static async joinChannel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { channelId } = req.params;
      const userId = req.auth.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          members: true,
          owner: true
        }
      });

      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }

      const existingMember = channel.members.some((member: { id: string }) => member.id === userId);
      if (existingMember) {
        return res.status(400).json({ message: 'Already a member of this channel' });
      }

      const updatedChannel = await prisma.channel.update({
        where: { id: channelId },
        data: {
          members: {
            connect: { id: userId }
          }
        },
        include: {
          members: true,
          owner: true
        }
      });

      const channelWithMemberCount = {
        ...updatedChannel,
        memberCount: updatedChannel.members.length
      };

      io.emit('channel:updated', channelWithMemberCount);
      return res.json(channelWithMemberCount);
    } catch (error) {
      return next(error);
    }
  }

  static async leaveChannel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { channelId } = req.params;
      const userId = req.auth.userId;

      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          members: true,
          owner: true
        }
      });

      if (!channel) {
        return res.status(404).json({ message: 'Channel not found' });
      }

      const existingMember = channel.members.some((member: { id: string }) => member.id === userId);
      if (!existingMember) {
        return res.status(400).json({ message: 'Not a member of this channel' });
      }

      if (channel.ownerId === userId) {
        return res.status(400).json({ message: 'Channel owner cannot leave the channel' });
      }

      const updatedChannel = await prisma.channel.update({
        where: { id: channelId },
        data: {
          members: {
            disconnect: { id: userId }
          }
        },
        include: {
          members: true,
          owner: true
        }
      });

      const channelWithMemberCount = {
        ...updatedChannel,
        memberCount: updatedChannel.members.length
      };

      io.emit('channel:updated', channelWithMemberCount);
      return res.json(channelWithMemberCount);
    } catch (error) {
      return next(error);
    }
  }

  static async getChannels(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.auth.userId;

      const channels = await prisma.channel.findMany({
        where: {
          OR: [
            { 
              AND: [
                { isPrivate: false },
                { name: { not: { startsWith: 'dm-' } } }
              ]
            },
            {
              AND: [
                { members: { some: { id: userId } } },
                { name: { not: { startsWith: 'dm-' } } }
              ]
            }
          ]
        },
        include: {
          members: true,
          owner: true,
          _count: {
            select: { members: true }
          }
        }
      });

      const dms = await prisma.channel.findMany({
        where: {
          AND: [
            { name: { startsWith: 'dm-' } },
            { ownerId: userId },
            { members: { some: { id: userId } } }
          ]
        },
        include: {
          members: true,
          owner: true,
          _count: {
            select: { members: true }
          }
        }
      });

      res.json({
        channels,
        directMessages: dms
      });
    } catch (error) {
      next(error);
    }
  }
} 