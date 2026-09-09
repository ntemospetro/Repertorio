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

const LOCAL_STORAGE_KEYS = {
  STRIPE_CONFIG: 'homoeo_saas_stripe_config_v1',
  BILLING_PAYMENTS: 'homoeo_saas_billing_payments_v1',
};

const DEFAULT_STRIPE_CONFIG: AdminStripeConfigResponse = {
  mode: 'test',
  publishableKey: '',
  secretKey: '',
  secretKeyMasked: '',
  secretKeyConfigured: false,
  webhookSecret: '',
  webhookSecretMasked: '',
  webhookSecretConfigured: false,
  isConfigured: false,
  webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/billing/webhook` : '/api/billing/webhook',
  updatedAt: new Date().toISOString()
};

const DEFAULT_SEED_PAYMENTS: BillingDepositRecord[] = [
  {
    id: 'pay-seed-1',
    therapistId: 'th-101',
    therapistName: 'Katharina Lindemann',
    therapistEmail: 'k.lindemann@naturheilpraxis-berlin.de',
    amountEur: 50,
    type: 'initial_deposit',
    status: 'succeeded',
    stripeSessionId: 'cs_test_initial_th101',
    createdAt: '2026-09-01T10:00:00Z',
    month: '2026-09',
    note: 'Initiales Token-Guthaben Praxis-Paket'
  },
  {
    id: 'pay-seed-2',
    therapistId: 'th-102',
    therapistName: 'Dr. med. Markus Vogel',
    therapistEmail: 'praxis@dr-vogel-muenchen.de',
    amountEur: 20,
    type: 'initial_deposit',
    status: 'succeeded',
    stripeSessionId: 'cs_test_initial_th102',
    createdAt: '2026-08-15T14:30:00Z',
    month: '2026-08',
    note: 'Startguthaben-Einzahlung'
  },
  {
    id: 'pay-seed-3',
    therapistId: 'th-103',
    therapistName: 'Sophie Brunner',
    therapistEmail: 'sophie.brunner@homoeopathie-zuerich.ch',
    amountEur: 100,
    type: 'initial_deposit',
    status: 'succeeded',
    stripeSessionId: 'cs_test_initial_th103',
    createdAt: '2026-09-02T08:15:00Z',
    month: '2026-09',
    note: 'Premium Start-Guthaben'
  }
];

function getStoredLocalConfig(): AdminStripeConfigResponse {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.STRIPE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STRIPE_CONFIG,
        ...parsed,
        webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/billing/webhook` : '/api/billing/webhook'
      };
    }
  } catch (e) {}
  return DEFAULT_STRIPE_CONFIG;
}

function saveStoredLocalConfig(cfg: Partial<AdminStripeConfigResponse>): AdminStripeConfigResponse {
  const current = getStoredLocalConfig();
  const merged: AdminStripeConfigResponse = {
    ...current,
    ...cfg,
    isConfigured: Boolean((cfg.publishableKey || current.publishableKey) && (cfg.secretKeyConfigured ?? current.secretKeyConfigured)),
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.STRIPE_CONFIG, JSON.stringify(merged));
  } catch (e) {}
  return merged;
}

export async function fetchAdminStripeConfig(): Promise<AdminStripeConfigResponse> {
  const local = getStoredLocalConfig();
  try {
    const res = await fetch('/api/admin/stripe/config');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object') {
        const merged = saveStoredLocalConfig(serverData);
        return merged;
      }
    }
  } catch (err) {
    // Network or offline, gracefully return local cache
  }
  return local;
}

export async function saveAdminStripeConfig(config: {
  mode: 'test' | 'live';
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
}): Promise<AdminStripeConfigResponse | null> {
  // Update local storage first so changes are immediately persisted
  const localSaved = saveStoredLocalConfig({
    mode: config.mode,
    publishableKey: config.publishableKey,
    secretKeyConfigured: Boolean(config.secretKey && !config.secretKey.includes('••••')) || getStoredLocalConfig().secretKeyConfigured,
    secretKeyMasked: config.secretKey && !config.secretKey.includes('••••')
      ? `${config.secretKey.slice(0, 7)}••••${config.secretKey.slice(-4)}`
      : getStoredLocalConfig().secretKeyMasked,
    webhookSecretConfigured: Boolean(config.webhookSecret && !config.webhookSecret.includes('••••')) || getStoredLocalConfig().webhookSecretConfigured,
    webhookSecretMasked: config.webhookSecret && !config.webhookSecret.includes('••••')
      ? `${config.webhookSecret.slice(0, 7)}••••${config.webhookSecret.slice(-4)}`
      : getStoredLocalConfig().webhookSecretMasked,
  });

  try {
    const res = await fetch('/api/admin/stripe/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      const serverData = await res.json();
      return saveStoredLocalConfig(serverData);
    }
  } catch (err) {
    console.warn('Backend /api/admin/stripe/config unreachable, using local storage state:', err);
  }
  return localSaved;
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
    if (res.status === 404) {
      return {
        success: false,
        error: 'Die Backend-Route /api/admin/stripe/test wurde auf Ihrem Hostinger/VPS-Server noch nicht aktualisiert (404). Bitte starten Sie die Node.js-Anwendung neu (z.B. per PM2, Container oder Neustart des Dienstes).'
      };
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Verbindung fehlgeschlagen' };
  }
}

export async function fetchBillingPayments(therapistId?: string): Promise<BillingDepositRecord[]> {
  let localPayments = DEFAULT_SEED_PAYMENTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.BILLING_PAYMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localPayments = parsed;
      }
    }
  } catch (e) {}

  try {
    const url = therapistId ? `/api/admin/billing/payments?therapistId=${therapistId}` : '/api/admin/billing/payments';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.payments)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEYS.BILLING_PAYMENTS, JSON.stringify(data.payments));
        } catch (e) {}
        return data.payments;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch payments from server, returning local copy:', err);
  }

  if (therapistId) {
    return localPayments.filter(p => p.therapistId === therapistId);
  }
  return localPayments;
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
