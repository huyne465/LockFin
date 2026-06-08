import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AlbumsRepository, type AlbumRow, type AlbumStat, type AlbumWritable } from './albums.repository';
import type { PostRow } from '../posts/posts.repository';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

export interface AlbumSummary extends AlbumRow {
  post_count: number;
  spent: number;
  remaining: number | null;
  cover_photo_url: string | null; // already falls back to the latest post photo
}

export interface AlbumDetail extends AlbumSummary {
  posts: PostRow[];
}

@Injectable()
export class AlbumsService {
  constructor(private readonly repo: AlbumsRepository) {}

  async create(userId: string, dto: CreateAlbumDto): Promise<AlbumDetail> {
    assertDateOrder(dto.start_date ?? null, dto.end_date ?? null);

    const album = await this.repo.create(userId, {
      name: dto.name,
      description: dto.description ?? null,
      is_public: dto.is_public ?? false,
      budget_amount: dto.budget_amount ?? null,
      start_date: dto.start_date ?? null,
      end_date: dto.end_date ?? null,
    });

    if (dto.post_ids?.length) {
      await this.repo.attachPosts(userId, album.id, dto.post_ids);
    }

    return this.detailForOwner(userId, album);
  }

  /** All of the signed-in user's albums, newest first, with aggregates. */
  async list(userId: string): Promise<AlbumSummary[]> {
    const albums = await this.repo.listByUser(userId);
    if (albums.length === 0) return [];
    const stats = await this.repo.statsForUser(
      userId,
      albums.map((a) => a.id),
    );
    return albums.map((a) => toSummary(a, stats.get(a.id), true));
  }

  /** Detail of an album the caller can see (owner, or any user for a public album). */
  async findOne(viewerId: string, id: string): Promise<AlbumDetail> {
    const album = await this.repo.findById(id);
    if (!album) throw new NotFoundException('Album not found');

    const isOwner = album.user_id === viewerId;
    if (!isOwner && !album.is_public) throw new NotFoundException('Album not found');

    if (isOwner) return this.detailForOwner(viewerId, album);
    return this.detailForOutsider(album);
  }

  async update(userId: string, id: string, dto: UpdateAlbumDto): Promise<AlbumDetail> {
    const existing = await this.repo.findOne(userId, id);
    if (!existing) throw new NotFoundException('Album not found');

    const nextStart = dto.start_date !== undefined ? dto.start_date : existing.start_date;
    const nextEnd = dto.end_date !== undefined ? dto.end_date : existing.end_date;
    assertDateOrder(nextStart, nextEnd);

    // Only forward keys the client actually sent so untouched columns are preserved.
    const patch: AlbumWritable = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.is_public !== undefined) patch.is_public = dto.is_public;
    if (dto.budget_amount !== undefined) patch.budget_amount = dto.budget_amount;
    if (dto.cover_photo_url !== undefined) patch.cover_photo_url = dto.cover_photo_url;
    if (dto.start_date !== undefined) patch.start_date = dto.start_date;
    if (dto.end_date !== undefined) patch.end_date = dto.end_date;

    const updated = (await this.repo.update(userId, id, patch)) ?? existing;
    return this.detailForOwner(userId, updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne(userId, id);
    if (!existing) throw new NotFoundException('Album not found');
    await this.repo.delete(userId, id); // posts revert to the pool via ON DELETE SET NULL
  }

  async addPosts(userId: string, id: string, postIds: string[]): Promise<AlbumDetail> {
    const album = await this.repo.findOne(userId, id);
    if (!album) throw new NotFoundException('Album not found');
    await this.repo.attachPosts(userId, id, postIds);
    return this.detailForOwner(userId, album);
  }

  async removePost(userId: string, id: string, postId: string): Promise<AlbumDetail> {
    const album = await this.repo.findOne(userId, id);
    if (!album) throw new NotFoundException('Album not found');
    await this.repo.detachPost(userId, id, postId);
    return this.detailForOwner(userId, album);
  }

  /** Public albums of another user (for profile viewing). */
  async publicAlbumsOf(userId: string): Promise<AlbumSummary[]> {
    const albums = await this.repo.listPublicByUser(userId);
    if (albums.length === 0) return [];
    const stats = await this.repo.statsForUser(
      userId,
      albums.map((a) => a.id),
    );
    // Outside viewer → hide money figures.
    return albums.map((a) => toSummary(a, stats.get(a.id), false));
  }

  /**
   * Verify an album exists and belongs to `userId`. Used by PostsService before
   * attaching a freshly-created post to an album.
   */
  async assertOwned(userId: string, albumId: string): Promise<void> {
    const album = await this.repo.findById(albumId);
    if (!album) throw new NotFoundException('Album not found');
    if (album.user_id !== userId) throw new ForbiddenException('Album does not belong to you');
  }

  private async detailForOwner(userId: string, album: AlbumRow): Promise<AlbumDetail> {
    const [stat, posts] = await Promise.all([
      this.repo.statsForAlbum(album.id),
      this.repo.postsOf(album.id, false),
    ]);
    return { ...toSummary(album, stat, true), posts };
  }

  private async detailForOutsider(album: AlbumRow): Promise<AlbumDetail> {
    const [stat, posts] = await Promise.all([
      this.repo.statsForAlbum(album.id),
      this.repo.postsOf(album.id, true), // hide private posts
    ]);
    return { ...toSummary(album, stat, false), posts };
  }
}

/**
 * Shape an album row + its aggregate into a summary. When `showMoney` is false
 * (outside viewer) the budget/spent figures are nulled out — only photos show.
 */
function toSummary(album: AlbumRow, stat: AlbumStat | undefined, showMoney: boolean): AlbumSummary {
  const post_count = stat?.post_count ?? 0;
  const spent = stat?.spent ?? 0;
  const cover = album.cover_photo_url ?? stat?.latest_cover ?? null;

  if (!showMoney) {
    return {
      ...album,
      budget_amount: null,
      cover_photo_url: cover,
      post_count,
      spent: 0,
      remaining: null,
    };
  }

  const remaining = album.budget_amount === null ? null : Number(album.budget_amount) - spent;
  return {
    ...album,
    budget_amount: album.budget_amount === null ? null : Number(album.budget_amount),
    cover_photo_url: cover,
    post_count,
    spent,
    remaining,
  };
}

function assertDateOrder(start: string | null, end: string | null): void {
  if (start && end && end < start) {
    throw new BadRequestException('end_date must be on or after start_date');
  }
}
