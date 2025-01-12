export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  channelId: string;
  threadId?: string;
  user: {
    id: string;
    username: string;
  };
}

export interface MessageCreateInput {
  content: string;
  channelId: string;
  userId: string;
}

export interface MessageUpdateInput {
  content: string;
} 