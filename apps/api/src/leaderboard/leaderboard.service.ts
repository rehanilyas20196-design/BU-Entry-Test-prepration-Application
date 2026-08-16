import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  full_name: string | null;
  xp: number;
  is_current_user: boolean;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Top students for the current week, ranked by XP earned this week (opt-in only). */
  async getWeekly(userId: string, limit = 50) {
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
    for (const e of events ?? []) {
      if (!optedIn.has(e.user_id)) continue;
      xpByUser.set(e.user_id, (xpByUser.get(e.user_id) ?? 0) + (e.amount ?? 0));
    }

    const rows: LeaderboardRow[] = Array.from(xpByUser.entries())
      .map(([uid, xp]) => ({
        user_id: uid,
        full_name: nameByUser.get(uid) ?? 'Student',
        xp,
        is_current_user: uid === userId,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, Math.min(limit, 100))
      .map((row, i) => ({ ...row, rank: i + 1 }));

    const currentUser = rows.find((r) => r.is_current_user) ?? null;

    return {
      period: 'weekly',
      week_start: weekStart.toISOString().slice(0, 10),
      week_end: new Date(weekStart.getTime() + 6 * 86400000).toISOString().slice(0, 10),
      entries: rows,
      current_user: currentUser
        ? { rank: currentUser.rank, xp: currentUser.xp }
        : null,
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

  private startOfWeek(now: Date): Date {
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = start
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}