import { Injectable } from '@nestjs/common';
import { ProfilesRepository, ProfileRow, ProfileSummary } from './profiles.repository';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly repo: ProfilesRepository) {}

  getProfile(userId: string): Promise<ProfileRow> {
    return this.repo.findById(userId);
  }

  /** Public profile of another user (name/avatar/username only). */
  getPublicProfile(userId: string): Promise<ProfileSummary> {
    return this.repo.findSummaryById(userId);
  }

  /** Update the signed-in user's editable fields. Username is never changed. */
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileRow> {
    const fields: Partial<Pick<ProfileRow, 'display_name' | 'avatar_url'>> = {};
    if (dto.display_name !== undefined) fields.display_name = dto.display_name.trim();
    if (dto.avatar_url !== undefined) fields.avatar_url = dto.avatar_url;
    if (Object.keys(fields).length === 0) return this.repo.findById(userId);
    return this.repo.updateProfile(userId, fields);
  }

  /** Find other users to send a friend request to. */
  searchProfiles(userId: string, query: string): Promise<ProfileSummary[]> {
    return this.repo.search(query ?? '', userId);
  }

  /**
   * Streak rules:
   *  - last_post_date == today    → no-op
   *  - last_post_date == yesterday → current_streak += 1
   *  - otherwise                  → current_streak = 1
   * highest_streak is updated when surpassed.
   */
  async updateStreak(userId: string): Promise<ProfileRow> {
    const profile = await this.repo.findById(userId);

    const today = this.toIsoDate(new Date());
    const yesterday = this.toIsoDate(this.addDays(new Date(), -1));

    if (profile.last_post_date === today) return profile;

    let currentStreak: number;
    if (profile.last_post_date === yesterday) {
      currentStreak = profile.current_streak + 1;
    } else {
      currentStreak = 1;
    }
    const highestStreak = Math.max(profile.highest_streak ?? 0, currentStreak);

    await this.repo.updateStreakFields(userId, {
      current_streak: currentStreak,
      highest_streak: highestStreak,
      last_post_date: today,
    });

    return {
      ...profile,
      current_streak: currentStreak,
      highest_streak: highestStreak,
      last_post_date: today,
    };
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private addDays(d: Date, days: number): Date {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
  }
}
