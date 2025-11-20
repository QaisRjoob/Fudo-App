import { makeAutoObservable, runInAction } from 'mobx';
import { Conversation, Message, User } from '../models';
import { ConversationRepository, UserRepository } from '../repositories';

export class ChatViewModel {
  conversation: Conversation | null = null;
  messages: Message[] = [];
  isLoading: boolean = false;
  isSending: boolean = false;
  error: string | null = null;
  otherUser: User | null = null;

  private conversationRepo: ConversationRepository;
  private userRepo: UserRepository;

  constructor() {
    this.conversationRepo = new ConversationRepository();
    this.userRepo = new UserRepository();
    
    makeAutoObservable(this);
  }

  async initialize(conversationId?: string, userId?: string): Promise<void> {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      let conv: Conversation | null = null;

      if (conversationId) {
        conv = await this.conversationRepo.getConversationById(conversationId);
      } else if (userId) {
        const currentUser = await this.userRepo.getCurrentUser();
        if (currentUser) {
          conv = await this.conversationRepo.getOrCreateConversation([currentUser.id, userId]);
        }
      }

      if (conv) {
        runInAction(() => {
          this.conversation = conv;
        });

        await this.loadMessages();
        await this.loadOtherUser();
        await this.markAsRead();
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to load conversation';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  private async loadMessages(): Promise<void> {
    if (!this.conversation) return;

    try {
      const messages = await this.conversationRepo.getMessages(this.conversation.id);
      
      runInAction(() => {
        this.messages = messages;
      });
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  }

  private async loadOtherUser(): Promise<void> {
    if (!this.conversation) return;

    try {
      const currentUser = await this.userRepo.getCurrentUser();
      if (!currentUser) return;

      const otherUserId = this.conversation.participantIds.find(id => id !== currentUser.id);
      if (otherUserId) {
        const user = await this.userRepo.getUserById(otherUserId);
        runInAction(() => {
          this.otherUser = user;
        });
      }
    } catch (error) {
      console.error('Error loading other user:', error);
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.conversation || !text.trim()) return;

    const currentUser = await this.userRepo.getCurrentUser();
    if (!currentUser) return;

    runInAction(() => {
      this.isSending = true;
    });

    try {
      const message = await this.conversationRepo.sendMessage({
        conversationId: this.conversation.id,
        senderId: currentUser.id,
        text: text.trim(),
      });

      // Update message status to sent after a delay (simulating network)
      setTimeout(async () => {
        await this.conversationRepo.updateMessageStatus(message.id, 'sent');
        
        // Reload messages
        await this.loadMessages();
      }, 1000);

      runInAction(() => {
        this.messages = [...this.messages, message];
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to send message';
      });
    } finally {
      runInAction(() => {
        this.isSending = false;
      });
    }
  }

  async editMessage(messageId: string, newText: string): Promise<void> {
    try {
      await this.conversationRepo.editMessage(messageId, newText);
      await this.loadMessages();
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to edit message';
      });
    }
  }

  async unsendMessage(messageId: string): Promise<void> {
    try {
      await this.conversationRepo.unsendMessage(messageId);
      await this.loadMessages();
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || 'Failed to unsend message';
      });
    }
  }

  private async markAsRead(): Promise<void> {
    if (!this.conversation) return;

    try {
      await this.conversationRepo.markConversationAsRead(this.conversation.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }
}
