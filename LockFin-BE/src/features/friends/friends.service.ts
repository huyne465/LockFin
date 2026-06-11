import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendsRepository, FriendshipRow } from './friends.repository';
import { ProfilesService } from '../profiles/profiles.service';
import { OneSignalService } from '../notifications/onesignal.service';

@Injectable()
export class FriendsService {
  constructor(
    private readonly repo: FriendsRepository,
    private readonly profiles: ProfilesService,
    private readonly push: OneSignalService,
  ) {}

  /** Display name (or @username) for a user, used in notification copy. */
  private async nameOf(userId: string): Promise<string> {
    const p = await this.profiles.getPublicProfile(userId).catch(() => null);
    return p?.display_name || p?.username || 'Một người bạn';
  }

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
            const accepted = await this.repo.updateStatus(existing.id, 'ACCEPTED');
            // The original requester (now `receiverId`) learns it was accepted.
            void this.notifyAccepted(receiverId, requesterId);
            return accepted;
          }
          throw new ConflictException('Friend request already sent');
      }
    }

    const created = await this.repo.create(requesterId, receiverId);
    void this.notifyRequest(receiverId, requesterId);
    return created;
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
    const accepted = await this.repo.updateStatus(friendshipId, 'ACCEPTED');
    void this.notifyAccepted(friendship.requester_id, userId);
    return accepted;
  }

  /** Tell `receiverId` that `requesterId` sent them a friend request. */
  private async notifyRequest(receiverId: string, requesterId: string): Promise<void> {
    const name = await this.nameOf(requesterId);
    await this.push.sendToUsers([receiverId], {
      title: 'Lời mời kết bạn',
      body: `${name} muốn kết bạn với bạn`,
      url: '/friends',
      data: { type: 'friend_request', requester_id: requesterId },
    });
  }

  /** Tell `requesterId` that `accepterId` accepted their friend request. */
  private async notifyAccepted(requesterId: string, accepterId: string): Promise<void> {
    const name = await this.nameOf(accepterId);
    await this.push.sendToUsers([requesterId], {
      title: 'Kết bạn thành công',
      body: `${name} đã chấp nhận lời mời kết bạn`,
      url: '/friends',
      data: { type: 'friend_accepted', accepter_id: accepterId },
    });
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
