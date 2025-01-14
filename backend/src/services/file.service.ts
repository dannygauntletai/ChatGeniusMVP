import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FileService {
  async handleFileUpload(file: any) {
    try {
      const fileRecord = await prisma.file.create({
        data: {
          id: file.id,
          name: file.name,
          type: file.type,
          url: file.url,
          channelId: file.channelId,
          userId: file.userId,
          status: 'PENDING'
        }
      });

      // Check if file type is supported for processing
      const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!supportedTypes.includes(file.type)) {
        await this.updateFileStatus(file.id, 'UNSUPPORTED');
        console.log(`Unsupported file type: ${file.type}`);
      }

      return fileRecord;
    } catch (error) {
      console.error('Error handling file upload:', error);
      throw error;
    }
  }

  async updateFileStatus(fileId: string, status: string) {
    try {
      return await prisma.file.update({
        where: { id: fileId },
        data: { status }
      });
    } catch (error) {
      console.error('Error updating file status:', error);
      throw error;
    }
  }

  async getChannelFiles(channelId: string) {
    try {
      return await prisma.file.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          channel: true
        }
      });
    } catch (error) {
      console.error('Error getting channel files:', error);
      throw error;
    }
  }

  async getUserFiles(userId: string) {
    try {
      return await prisma.file.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          channel: true
        }
      });
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  }
} 