import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  full_name: string | null;
  xp: number;
  correct_count: number;
  incorrect_count: number;
  is_current_user: boolean;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Top students for the current week, ranked by chosen metric (XP or questions). */
  async getWeekly(
    userId: string,
    limit = 50,
    metric = 'xp',
    optedInOnly = true,
  ) {
    const weekStart = this.startOfWeek(new Date());

    const [{ data: events }, { data: stats }, { data: profiles }] = await Promise.all([
      this.supabase.admin
        .from('xp_events')
        .select('user_id, amount')
        .gte('created_at', weekStart.toISOString()),
      this.supabase.admin.from('user_stats').select('user_id, leaderboard_opt_in'),
      this.supabase.admin.from('profiles').select('user_id, full_name'),
    ]);

    const optedIn = new Set(
      (stats ?? [])
        .filter((s) => s.leaderboard_opt_in)
        .map((s) => s.user_id),
    );
    const nameByUser = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.full_name]),
    );

    const xpByUser = new Map<string, number>();
    const correctByUser = new Map<string, number>();
    const incorrectByUser = new Map<string, number>();

    for (const e of events ?? []) {
      const uid = e.user_id;
      if (metric === 'xp' && optedInOnly && !optedIn.has(uid)) continue;
      if (metric === 'questions' && !optedIn.has(uid)) continue;

      xpByUser.set(uid, (xpByUser.get(uid) ?? 0) + (e.amount ?? 0));

      if (!correctByUser.has(uid)) correctByUser.set(uid, 0);
      if (!incorrectByUser.has(uid)) incorrectByUser.set(uid, 0);
    }

    const rows: LeaderboardRow[] = Array.from(xpByUser.entries())
      .map(([uid, xp]) => ({
        user_id: uid,
        full_name: nameByUser.get(uid) ?? 'Student',
        xp,
        correct_count: correctByUser.get(uid) ?? 0,
        incorrect_count: incorrectByUser.get(uid) ?? 0,
        is_current_user: uid === userId,
      }))
      .sort((a, b) => {
        if (metric === 'xp') {
          return b.xp - a.xp;
        } else {
          const totalA = (a.correct_count ?? 0) + (a.incorrect_count ?? 0);
          const totalB = (b.correct_count ?? 0) + (b.incorrect_count ?? 0);
          return totalB - totalA;
        }
      })
      .slice(0, Math.min(limit, 100))
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const currentUser = rows.find((r) => r.is_current_user) ?? null;

    return {
      period: 'weekly',
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: new Date(weekStart.getTime() + 6 * 86400000).toISOString().slice(0, 10),
      entries: rows,
      current_user: currentUser
        ? { rank: currentUser.rank, xp: currentUser.xp, correct: currentUser.correct_count, incorrect: currentUser.incorrect_count }
        : null,
      metric,
    };
  }

  /** Whether the current user is on the public leaderboard. */
  async isOptedIn(userId: string) {
    const { data } = await this.supabase.admin
      .from('user_stats')
      .select('leaderboard_opt_in')
      .eq('user_id', userId)
      .maybeSingle();
    return (data?.leaderboard_opt_in ?? false) === true;
  }

  /** Toggle public leaderboard visibility. */
  async setOptIn(userId: string, optedIn: boolean) {
    const { data } = await this.supabase.admin
      .from('user_stats')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      await this.supabase.admin
        .from('user_stats')
        .update({ leaderboard_opt_in: optedIn })
        .eq('id', data.id);
    } else {
      await this.supabase.admin.from('user_stats').insert({
        user_id: userId,
        leaderboard_opt_in: optedIn,
      });
    }
    return { opted_in: optedIn };
  }

  /** Get leaderboard stats for admin dashboard - correct/wrong counts per user */
  async getAdminLeaderboardStats(limit = 100) {
    const [{ data: events }, { data: stats }, { data: profiles }] = await Promise.all([
      this.supabase.admin
        .from('xp_events')
        .select('user_id')
        .gte('created_at', this.startOfWeek(new Date()).toISOString()),
      this.supabase.admin.from('user_stats').select('user_id, leaderboard_opt_in'),
      this.supabase.admin.from('profiles').select('user_id, full_name'),
    ]);

    const optedIn = new Set(
      (stats ?? [])
        .filter((s) => s.leaderboard_opt_in)
        .map((s) => s.user_id),
    );
    const nameByUser = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.full_name]),
    );

    const correctByUser = new Map<string, number>();
    const incorrectByUser = new Map<string, number>();

    for (const e of events ?? []) {
      if (!optedIn.has(e.user_id)) continue;
      if (!correctByUser.has(e.user_id)) correctByUser.set(e.user_id, 0);
      if (!incorrectByUser.has(e.user_id)) incorrectByUser.set(e.user_id, 0);
      if ((e.amount ?? 0) > 0) {
        correctByUser.set(e.user_id, (correctByUser.get(e.user_id) ?? 0) + 1);
      } else {
        incorrectByUser.set(e.user_id, (incorrectByUser.get(e.user_id) ?? 0) + 1);
      }
    }

    const results = Array.from(correctByUser.entries())
      .map(([uid, correct]) => ({
        user_id: uid,
        full_name: nameByUser.get(uid) ?? 'Student',
        correct,
        incorrect: incorrectByUser.get(uid) ?? 0,
        total: (correctByUser.get(uid) ?? 0) + (incorrectByUser.get(uid) ?? 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return results;
  }

  private startOfWeek(now: Date): Date {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}