import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../core/supabase/supabase.service';
import type { BudgetPeriod } from './dto/create-budget.dto';

export interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string | null;
  period_type: BudgetPeriod;
  period_start: string; // 'YYYY-MM-DD'
  amount: number;
  name: string | null; // tên tự đặt; null ⇒ hiển thị theo category
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string | null;
  color_hex: string | null;
}

/** A budget row plus the dynamically-summed spend for its period. */
export interface BudgetWithSpent extends BudgetRow {
  category: BudgetCategory | null;
  spent: number;
}

@Injectable()
export class BudgetsRepository {
  private readonly TABLE = 'budgets';

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Create a new budget for (user, category|total, period_type, period_start).
   * Mỗi lần "đặt ngân sách" là một dòng mới — không còn ghi đè theo natural key,
   * nên user có thể có nhiều budget cùng category+kỳ, phân biệt bằng `name`.
   * `period_start` must already be normalised to the start of the period.
   */
  async create(
    userId: string,
    input: {
      category_id: string | null;
      period_type: BudgetPeriod;
      period_start: string;
      amount: number;
      name: string | null;
    },
  ): Promise<BudgetRow> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .insert({
        user_id: userId,
        category_id: input.category_id,
        period_type: input.period_type,
        period_start: input.period_start,
        amount: input.amount,
        name: input.name,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as BudgetRow;
  }

  async findOne(userId: string, id: string): Promise<BudgetRow | null> {
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as BudgetRow) ?? null;
  }

  async update(
    userId: string,
    id: string,
    patch: { amount?: number; name?: string | null },
  ): Promise<BudgetRow | null> {
    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.amount !== undefined) fields.amount = patch.amount;
    if (patch.name !== undefined) fields.name = patch.name;
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .update(fields)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return (data as BudgetRow) ?? null;
  }

  async delete(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from(this.TABLE)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  /**
   * Every budget covering `date`, with `spent` summed from posts in each budget's
   * period. Prefers the `get_budget_status` RPC; falls back to a client-side
   * computation (mirrors `statsByCategory`).
   */
  async findForDate(userId: string, date: string): Promise<BudgetWithSpent[]> {
    const rpc = await this.supabase.admin.rpc('get_budget_status', {
      p_user_id: userId,
      p_date: date,
    });

    if (!rpc.error && rpc.data) {
      const rows = rpc.data as Array<{
        budget_id: string;
        category_id: string | null;
        period_type: BudgetPeriod;
        period_start: string;
        amount: number;
        spent: number;
      }>;
      // The RPC returns no created_at/updated_at; hydrate the full rows + category join.
      return this.hydrate(userId, rows);
    }

    return this.computeForDate(userId, date);
  }

  /** Join category metadata and merge the RPC spend onto full budget rows. */
  private async hydrate(
    userId: string,
    spends: Array<{ budget_id: string; spent: number }>,
  ): Promise<BudgetWithSpent[]> {
    if (spends.length === 0) return [];
    const ids = spends.map((s) => s.budget_id);
    const { data, error } = await this.supabase.admin
      .from(this.TABLE)
      .select('*, categories(id, name, icon, color_hex)')
      .eq('user_id', userId)
      .in('id', ids);
    if (error) throw error;

    const spentById = new Map(spends.map((s) => [s.budget_id, Number(s.spent)]));
    return (data ?? []).map((row) => {
      const r = row as unknown as BudgetRow & {
        categories: BudgetCategory | BudgetCategory[] | null;
      };
      const category = Array.isArray(r.categories) ? r.categories[0] ?? null : r.categories;
      return {
        ...this.stripJoin(r),
        category: r.category_id ? category : null,
        spent: spentById.get(r.id) ?? 0,
      };
    });
  }

  /**
   * RPC-free fallback: load this user's budgets covering `date`, then sum the
   * matching posts per budget on the client.
   */
  private async computeForDate(userId: string, date: string): Promise<BudgetWithSpent[]> {
    const { data: budgets, error: bErr } = await this.supabase.admin
      .from(this.TABLE)
      .select('*, categories(id, name, icon, color_hex)')
      .eq('user_id', userId);
    if (bErr) throw bErr;

    const covering = (budgets ?? []).filter((row) => {
      const b = row as unknown as BudgetRow;
      const [start, end] = periodRange(b.period_type, b.period_start);
      return start <= date && date < end;
    });
    if (covering.length === 0) return [];

    // One pass over the user's posts that could land in any covering period.
    const earliest = covering.reduce(
      (min, row) => ((row as BudgetRow).period_start < min ? (row as BudgetRow).period_start : min),
      (covering[0] as BudgetRow).period_start,
    );
    const latestEnd = covering.reduce((max, row) => {
      const b = row as unknown as BudgetRow;
      const [, end] = periodRange(b.period_type, b.period_start);
      return end > max ? end : max;
    }, periodRange((covering[0] as BudgetRow).period_type, (covering[0] as BudgetRow).period_start)[1]);

    const { data: posts, error: pErr } = await this.supabase.admin
      .from('posts')
      .select('id, amount, category_id, created_at, categories(type)')
      .eq('user_id', userId)
      .gte('created_at', earliest)
      .lt('created_at', latestEnd);
    if (pErr) throw pErr;

    // `budgetId:postId` pairs the user opted out of — those posts skip that budget.
    const coveringIds = covering.map((row) => (row as unknown as BudgetRow).id);
    const { data: excl, error: eErr } = await this.supabase.admin
      .from('post_budget_exclusions')
      .select('post_id, budget_id')
      .in('budget_id', coveringIds);
    if (eErr) throw eErr;
    const excluded = new Set(
      (excl ?? []).map((e) => `${(e as { budget_id: string }).budget_id}:${(e as { post_id: string }).post_id}`),
    );

    return covering.map((row) => {
      const r = row as unknown as BudgetRow & {
        categories: BudgetCategory | BudgetCategory[] | null;
      };
      const [start, end] = periodRange(r.period_type, r.period_start);
      let spent = 0;
      for (const post of posts ?? []) {
        const p = post as unknown as {
          id: string;
          amount: number;
          category_id: string;
          created_at: string;
          categories: { type: string } | { type: string }[] | null;
        };
        const ts = p.created_at.slice(0, 10);
        if (ts < start || ts >= end) continue;
        if (r.category_id) {
          if (p.category_id !== r.category_id) continue;
        } else {
          const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
          if (cat?.type !== 'EXPENSE') continue;
        }
        if (excluded.has(`${r.id}:${p.id}`)) continue;
        spent += Number(p.amount);
      }
      const category = Array.isArray(r.categories) ? r.categories[0] ?? null : r.categories;
      return {
        ...this.stripJoin(r),
        category: r.category_id ? category : null,
        spent,
      };
    });
  }

  /** Drop the joined `categories` field, leaving a clean BudgetRow. */
  private stripJoin(row: BudgetRow & { categories?: unknown }): BudgetRow {
    const { categories: _omit, ...rest } = row as BudgetRow & { categories?: unknown };
    return rest as BudgetRow;
  }
}

/** [start, end) ISO dates (YYYY-MM-DD) for a normalised period_start. */
export function periodRange(period: BudgetPeriod, startIso: string): [string, string] {
  const [y, m, d] = startIso.split('-').map(Number);
  let end: Date;
  if (period === 'DAY') end = new Date(Date.UTC(y, m - 1, d + 1));
  else if (period === 'MONTH') end = new Date(Date.UTC(y, m, 1));
  else end = new Date(Date.UTC(y + 1, 0, 1));
  return [startIso, end.toISOString().slice(0, 10)];
}
