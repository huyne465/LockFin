import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';

export type CategoryType = 'EXPENSE' | 'INCOME' | 'SAVING' | 'GOAL';

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  color_hex: string | null;
}

@Injectable()
export class CategoriesRepository {
  private readonly TABLE = 'categories';

  constructor(private readonly supabase: SupabaseService) {}

  async listForUser(userId: string): Promise<CategoryRow[]> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`);
    if (error) throw error;
    return (data ?? []) as CategoryRow[];
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .insert({ ...dto, user_id: userId })
      .select('*')
      .single();
    if (error) throw error;
    return data as CategoryRow;
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}
