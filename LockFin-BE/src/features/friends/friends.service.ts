import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository, FriendshipRow } from './friends.repository';

@Injectable()
export class FriendsService {
  constructor(private readonly repo: FriendsRepository) {}

  /**
   * Send a friend request. If the receiver has already sent the current user a
   * pending request, accept it instead (mutual intent → instant friendship).
   */
  async sendRequest(requesterId: string, receiverId: string): Promise<FriendshipRow> {
    if (requesterId === receiverId) {
      throw new BadRequestException('You cannot add yourself as a friend');
    }

    const existing = await this.repo.findBetween(requesterId, receiverId);
    if (existing) {
      switch (existing.status) {
        case 'ACCEPTED':
          throw new ConflictException('You are already friends');
        case 'BLOCKED':
          throw new ForbiddenException('This user is unavailable');
        case 'PENDING':
          // Reverse pending request → accept it. Same-direction → duplicate.
          if (existing.receiver_id === requesterId) {
            return this.repo.updateStatus(existing.id, 'ACCEPTED');
          }
          throw new ConflictException('Friend request already sent');
      }
    }

    return this.repo.create(requesterId, receiverId);
  }

  /** Receiver accepts a pending request. */
  async accept(userId: string, friendshipId: string): Promise<FriendshipRow> {
    const friendship = await this.getOwnedOrThrow(friendshipId, userId);
    if (friendship.status !== 'PENDING') {
      throw new ConflictException('This request is not pending');
    }
    if (friendship.receiver_id !== userId) {
      throw new ForbiddenException('Only the receiver can accept this request');
    }
    return this.repo.updateStatus(friendshipId, 'ACCEPTED');
  }

  /**
   * Remove a friendship row the user is part of. Covers three cases with one
   * endpoint: decline an incoming request, cancel a sent request, or unfriend.
   */
  async remove(userId: string, friendshipId: string): Promise<void> {
    await this.getOwnedOrThrow(friendshipId, userId);
    await this.repo.delete(friendshipId);
  }

  listFriends(userId: string) {
    return this.repo.listAccepted(userId);
  }

  listIncoming(userId: string) {
    return this.repo.listIncoming(userId);
  }

  listOutgoing(userId: string) {
    return this.repo.listOutgoing(userId);
  }

  private async getOwnedOrThrow(friendshipId: string, userId: string): Promise<FriendshipRow> {
    const friendship = await this.repo.findById(friendshipId);
    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }
    if (friendship.requester_id !== userId && friendship.receiver_id !== userId) {
      throw new ForbiddenException('You are not part of this friendship');
    }
    return friendship;
  }
}
