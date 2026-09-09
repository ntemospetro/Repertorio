import { StripeConfig, BillingDepositRecord } from '../types';

export interface AdminStripeConfigResponse extends StripeConfig {
  secretKeyMasked: string;
  secretKeyConfigured: boolean;
  webhookSecretMasked: string;
  webhookSecretConfigured: boolean;
}

export interface TherapistBillingStatus {
  therapistId: string;
  balanceEur: number;
  totalDepositedEur: number;
  lowBalanceThreshold: number;
  isLowBalance: boolean;
  autoReloadEnabled: boolean;
  autoReloadAmount: number;
  lastDepositAt?: string;
  recentPayments: BillingDepositRecord[];
}

export type TherapistBalanceResponse = TherapistBillingStatus;

export async function fetchAdminStripeConfig(): Promise<AdminStripeConfigResponse | null> {
  try {
    const res = await fetch('/api/admin/stripe/config');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch stripe config:', err);
  }
  return null;
}

export async function saveAdminStripeConfig(config: {
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
}): Promise<AdminStripeConfigResponse | null> {
  try {
    const res = await fetch('/api/admin/stripe/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to save stripe config:', err);
  }
  return null;
}

export async function testStripeConnection(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  livemode?: boolean;
}> {
  try {
    const res = await fetch('/api/admin/stripe/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Verbindung fehlgeschlagen' };
  }
}

export async function fetchBillingPayments(therapistId?: string): Promise<BillingDepositRecord[]> {
  try {
    const url = therapistId ? `/api/admin/billing/payments?therapistId=${therapistId}` : '/api/admin/billing/payments';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.payments || [];
    }
  } catch (err) {
    console.warn('Failed to fetch payments:', err);
  }
  return [];
}

export async function createCheckoutSession(params: {
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  amountEur: number;
  type?: 'initial_deposit' | 'manual_reload' | 'auto_reload' | 'package_purchase';
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{
  sessionId: string;
  url: string;
  mode: 'stripe' | 'sandbox';
  message?: string;
} | null> {
  try {
    const res = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to create checkout session:', err);
  }
  return null;
}

export async function fetchTherapistBillingStatus(therapistId: string): Promise<TherapistBillingStatus | null> {
  try {
    const res = await fetch(`/api/therapist/billing/${therapistId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Failed to fetch billing status for ${therapistId}:`, err);
  }
  return null;
}

export async function topUpTherapistBalance(params: {
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  amountEur: number;
  type?: 'initial_deposit' | 'manual_reload' | 'auto_reload' | 'package_purchase';
  note?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/therapist/billing/top-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to top up balance:', err);
    return false;
  }
}

export async function updateTherapistBillingSettings(params: {
  therapistId: string;
  lowBalanceThreshold?: number;
  autoReloadEnabled?: boolean;
  autoReloadAmount?: number;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/therapist/billing/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to update billing settings:', err);
    return false;
  }
}

// Convenience aliases and functions for UI components
export const fetchTherapistBalance = fetchTherapistBillingStatus;

export async function updateTherapistAutoReload(therapistId: string, enabled: boolean, amount = 20): Promise<boolean> {
  return updateTherapistBillingSettings({
    therapistId,
    autoReloadEnabled: enabled,
    autoReloadAmount: amount
  });
}

export async function updateTherapistThreshold(therapistId: string, threshold: number): Promise<boolean> {
  return updateTherapistBillingSettings({
    therapistId,
    lowBalanceThreshold: threshold
  });
}

export async function adminAdjustTherapistBalance(
  therapistId: string,
  amountEur: number,
  note?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const res = await fetch('/api/admin/billing/balance/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ therapistId, amountEur, note })
    });
    return await res.json();
  } catch (err: any) {
    console.warn('Failed to adjust therapist balance:', err);
    return { success: false, error: err.message || 'Netzwerkfehler' };
  }
}
