import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface FriendshipRow {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
}

/** A friendship row joined with the *other* party's public profile. */
export interface FriendshipWithProfile extends FriendshipRow {
  requester: ProfileSummary | null;
  receiver: ProfileSummary | null;
}

export interface ProfileSummary {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const PROFILE_FIELDS = 'id, username, display_name, avatar_url';

@Injectable()
export class FriendsRepository {
  private readonly TABLE = 'friendships';

  constructor(private readonly supabase: SupabaseService) {}

  /** The single friendship row between two users, in either direction (if any). */
  async findBetween(a: string, b: string): Promise<FriendshipRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .or(
        `and(requester_id.eq.${a},receiver_id.eq.${b}),and(requester_id.eq.${b},receiver_id.eq.${a})`,
      )
      .maybeSingle();
    if (error) throw error;
    return (data as FriendshipRow) ?? null;
  }

  async findById(id: string): Promise<FriendshipRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data as FriendshipRow) ?? null;
  }

  async create(requesterId: string, receiverId: string): Promise<FriendshipRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'PENDING' })
      .select('*')
      .single();
    if (error) throw error;
    return data as FriendshipRow;
  }

  async updateStatus(id: string, status: FriendshipStatus): Promise<FriendshipRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as FriendshipRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.admin.from(this.TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  /** Accepted friendships involving the user, with both profiles joined. */
  async listAccepted(userId: string): Promise<FriendshipWithProfile[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select(
        `*, requester:profiles!requester_id(${PROFILE_FIELDS}), receiver:profiles!receiver_id(${PROFILE_FIELDS})`,
      )
      .eq('status', 'ACCEPTED')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FriendshipWithProfile[];
  }

  /** Pending requests where the user is the receiver (incoming). */
  async listIncoming(userId: string): Promise<FriendshipWithProfile[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select(`*, requester:profiles!requester_id(${PROFILE_FIELDS})`)
      .eq('status', 'PENDING')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FriendshipWithProfile[];
  }

  /** Pending requests the user has sent (outgoing). */
  async listOutgoing(userId: string): Promise<FriendshipWithProfile[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select(`*, receiver:profiles!receiver_id(${PROFILE_FIELDS})`)
      .eq('status', 'PENDING')
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as FriendshipWithProfile[];
  }

  /** IDs of users who are accepted friends of the given user. */
  async acceptedFriendIds(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('requester_id, receiver_id')
      .eq('status', 'ACCEPTED')
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
    if (error) throw error;
    return (data ?? []).map((r: { requester_id: string; receiver_id: string }) =>
      r.requester_id === userId ? r.receiver_id : r.requester_id,
    );
  }
}
