import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BudgetsRepository, type BudgetWithSpent } from './budgets.repository';
import { SupabaseService } from '../../core/supabase/supabase.service';
import type { BudgetPeriod, CreateBudgetDto } from './dto/create-budget.dto';

export interface BudgetStatus {
  id: string;
  user_id: string;
  category_id: string | null;
  period_type: BudgetPeriod;
  period_start: string;
  amount: number;
  name: string | null;
  category: { id: string; name: string; icon: string | null; color_hex: string | null } | null;
  spent: number;
  remaining: number;
  percent: number;
  is_over: boolean;
  created_at: string;
  updated_at: string;
}

/** Lightweight per-budget impact returned alongside a freshly created post. */
export interface BudgetImpact {
  budget_id: string;
  period_type: BudgetPeriod;
  category_id: string | null;
  remaining: number;
  is_over: boolean;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly repo: BudgetsRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetStatus> {
    const categoryId = dto.category_id ?? null;
    if (categoryId) await this.assertCategoryOwned(userId, categoryId);

    const period_start = normalizePeriodStart(dto.period_type, dto.period_start);
    const created = await this.repo.create(userId, {
      category_id: categoryId,
      period_type: dto.period_type,
      period_start,
      amount: dto.amount,
      name: dto.name?.trim() || null,
    });

    // Re-read through the spend pipeline so the response carries fresh spent/remaining.
    // Match on the new row's id — nhiều budget có thể trùng category+kỳ.
    const date = todayIso();
    const onDate = period_start <= date && date < periodEnd(dto.period_type, period_start) ? date : period_start;
    const status = (await this.statusForDate(userId, onDate)).find((b) => b.id === created.id);
    if (!status) throw new NotFoundException('Budget not found after create');
    return status;
  }

  /** All budgets covering `date`, optionally filtered to one period_type. */
  async statusForDate(userId: string, date: string, periodType?: BudgetPeriod): Promise<BudgetStatus[]> {
    const rows = await this.repo.findForDate(userId, date);
    const filtered = periodType ? rows.filter((r) => r.period_type === periodType) : rows;
    return filtered.map(toStatus);
  }

  async update(
    userId: string,
    id: string,
    patch: { amount?: number; name?: string | null },
  ): Promise<BudgetStatus> {
    const updated = await this.repo.update(userId, id, {
      amount: patch.amount,
      // chuỗi rỗng ⇒ xoá tên (về null); undefined ⇒ giữ nguyên
      name: patch.name === undefined ? undefined : patch.name?.trim() || null,
    });
    if (!updated) throw new NotFoundException('Budget not found');
    // Surface the recomputed spend for the budget's own period.
    const onDate = updated.period_start <= todayIso() && todayIso() < periodEnd(updated.period_type, updated.period_start)
      ? todayIso()
      : updated.period_start;
    const status = (await this.statusForDate(userId, onDate)).find((b) => b.id === id);
    if (!status) throw new NotFoundException('Budget not found');
    return status;
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findOne(userId, id);
    if (!existing) throw new NotFoundException('Budget not found');
    await this.repo.delete(userId, id);
  }

  /**
   * Compact budget impact for a just-created post: only budgets relevant to the
   * post's category (its category-scoped budgets + the total EXPENSE budgets).
   */
  async impactForPost(userId: string, postDateIso: string, categoryId: string): Promise<BudgetImpact[]> {
    const date = postDateIso.slice(0, 10);
    const statuses = await this.statusForDate(userId, date);
    return statuses
      .filter((b) => b.category_id === categoryId || b.category_id === null)
      .map((b) => ({
        budget_id: b.id,
        period_type: b.period_type,
        category_id: b.category_id,
        remaining: b.remaining,
        is_over: b.is_over,
      }));
  }

  /** A category may be a user-owned row or a shared/global one (user_id null). */
  private async assertCategoryOwned(userId: string, categoryId: string): Promise<void> {
    const { data, error } = await this.supabase.admin
      .from('categories')
      .select('id, user_id')
      .eq('id', categoryId)
      .maybeSingle();
    if (error) throw error;
    if (!data || (data.user_id !== null && data.user_id !== userId)) {
      throw new NotFoundException('Category not found');
    }
  }
}

function toStatus(row: BudgetWithSpent): BudgetStatus {
  const amount = Number(row.amount);
  const spent = Number(row.spent);
  const remaining = amount - spent;
  const percent = amount > 0 ? Math.round((spent / amount) * 10000) / 10000 : 0;
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    period_type: row.period_type,
    period_start: row.period_start,
    amount,
    name: row.name,
    category: row.category,
    spent,
    remaining,
    percent,
    is_over: spent > amount,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Snap an arbitrary in-period date to the canonical start of its period. */
export function normalizePeriodStart(period: BudgetPeriod, dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  if (period === 'DAY') return dateIso;
  if (period === 'MONTH') return `${y}-${String(m).padStart(2, '0')}-01`;
  if (period === 'YEAR') return `${y}-01-01`;
  throw new BadRequestException('Invalid period_type');
}

function periodEnd(period: BudgetPeriod, startIso: string): string {
  const [y, m, d] = startIso.split('-').map(Number);
  let end: Date;
  if (period === 'DAY') end = new Date(Date.UTC(y, m - 1, d + 1));
  else if (period === 'MONTH') end = new Date(Date.UTC(y, m, 1));
  else end = new Date(Date.UTC(y + 1, 0, 1));
  return end.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
