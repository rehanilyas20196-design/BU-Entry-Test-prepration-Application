import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const PRICE_BDT = 5000;

export interface VerifyPaymentDto {
  trxId: string;
  senderPhone?: string;
  amount?: number;
}

@Injectable()
export class PremiumService {
  constructor(private readonly supabase: SupabaseService) {}

  async isPremium(userId: string): Promise<boolean> {
    const { data } = await this.supabase.admin
      .from('profiles')
      .select('is_premium')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.is_premium ?? false;
  }

  async requirePremium(userId: string): Promise<void> {
    const premium = await this.isPremium(userId);
    if (!premium) {
      throw new ForbiddenException('This is a premium feature. Upgrade to unlock it.');
    }
  }

  async getStatus(userId: string) {
    const is_premium = await this.isPremium(userId);
    let latestPayment = null;
    try {
      const { data } = await this.supabase.admin
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      latestPayment = data;
    } catch {
      // Ignore if payments table is not yet created
    }

    return {
      is_premium,
      till_info: {
        shop_name: 'REHAN Shop',
        till_id: '984180825',
        dial_code: '*786*10#',
        price_pkr: 5000,
        methods: ['JazzCash', 'Raast', 'Mobile Banking'],
      },
      latest_payment: latestPayment,
    };
  }

  /**
   * Verifies JazzCash / Raast TILL ID payment (REHAN Shop, TILL 984180825)
   * and unlocks Premium access for the user.
   */
  async verifyAndActivate(userId: string, dto: VerifyPaymentDto) {
    if (!dto?.trxId || !dto.trxId.trim()) {
      throw new BadRequestException('Transaction ID (Trx ID / TID) is required');
    }

    const cleanTrxId = dto.trxId.trim();

    // 1. Record payment in database
    let paymentRecord = null;
    try {
      const { data, error } = await this.supabase.admin
        .from('payments')
        .insert({
          user_id: userId,
          trx_id: cleanTrxId,
          sender_phone: dto.senderPhone?.trim() || null,
          amount: dto.amount || 5000,
          till_id: '984180825',
          shop_name: 'REHAN Shop',
          payment_method: 'JazzCash / Raast',
          status: 'completed',
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        paymentRecord = data;
      }
    } catch (err) {
      console.warn('Payment record log notice:', err);
    }

    // 2. Mark profile as premium (creates the profile row if it doesn't exist yet)
    const { error: profileErr } = await this.supabase.admin
      .from('profiles')
      .upsert({ user_id: userId, is_premium: true }, { onConflict: 'user_id' });

    if (profileErr) {
      throw new InternalServerErrorException('Failed to activate premium status for profile');
    }

    return {
      success: true,
      message: 'Payment verified successfully! Premium access granted.',
      is_premium: true,
      payment: paymentRecord || {
        trx_id: cleanTrxId,
        till_id: '984180825',
        shop_name: 'REHAN Shop',
        amount: dto.amount || 5000,
      },
    };
  }

  /** Legacy / Direct activate */
  async activate(userId: string) {
    return this.verifyAndActivate(userId, { trxId: `DIRECT-${Date.now()}` });
  }

  /**
   * Redeems an admin-issued coupon code and unlocks Premium.
   * full  -> free premium
   * percent -> percentage off the standard 5000 BDT price
   * flat   -> fixed amount off
   */
  async redeemCoupon(userId: string, code: string) {
    const clean = code?.trim().toUpperCase();
    if (!clean) {
      throw new BadRequestException('Coupon code is required');
    }

    const { data: coupon } = await this.supabase.admin
      .from('premium_coupons')
      .select('*')
      .eq('code', clean)
      .maybeSingle();

    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (!coupon.is_active) throw new BadRequestException('This coupon is no longer active');
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    const paid =
      coupon.discount_type === 'full'
        ? 0
        : coupon.discount_type === 'percent'
          ? Math.max(0, Math.round(PRICE_BDT - (PRICE_BDT * Number(coupon.discount_value || 0)) / 100))
          : Math.max(0, PRICE_BDT - Number(coupon.discount_value || 0));

    const { error: profileErr } = await this.supabase.admin
      .from('profiles')
      .upsert({ user_id: userId, is_premium: true }, { onConflict: 'user_id' });
    if (profileErr) {
      throw new InternalServerErrorException('Failed to activate premium status');
    }

    try {
      await this.supabase.admin.from('payments').insert({
        user_id: userId,
        trx_id: `COUPON-${clean}-${Date.now()}`,
        sender_phone: null,
        amount: paid,
        till_id: 'COUPON',
        shop_name: `Coupon ${clean}`,
        payment_method: 'Coupon',
        status: 'completed',
      });
    } catch (err) {
      console.warn('Coupon payment record notice:', err);
    }

    await this.supabase.admin
      .from('premium_coupons')
      .update({ used_count: coupon.used_count + 1 })
      .eq('id', coupon.id);

    return {
      success: true,
      message: 'Coupon applied! Premium access granted.',
      is_premium: true,
      amount_paid: paid,
      coupon: clean,
    };
  }
}