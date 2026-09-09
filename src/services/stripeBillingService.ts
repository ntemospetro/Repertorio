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
  THERAPIST_BALANCES: 'homoeo_saas_therapist_balances_v1',
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

const INITIAL_DEMO_BALANCES: Record<string, TherapistBillingStatus> = {
  'th-101': {
    therapistId: 'th-101',
    balanceEur: 42.50,
    totalDepositedEur: 50.00,
    lowBalanceThreshold: 5.00,
    isLowBalance: false,
    autoReloadEnabled: false,
    autoReloadAmount: 20.00,
    lastDepositAt: '2026-09-01T10:00:00Z',
    recentPayments: []
  },
  'th-102': {
    therapistId: 'th-102',
    balanceEur: 18.20,
    totalDepositedEur: 20.00,
    lowBalanceThreshold: 5.00,
    isLowBalance: false,
    autoReloadEnabled: true,
    autoReloadAmount: 20.00,
    lastDepositAt: '2026-08-15T14:30:00Z',
    recentPayments: []
  },
  'th-103': {
    therapistId: 'th-103',
    balanceEur: 98.40,
    totalDepositedEur: 100.00,
    lowBalanceThreshold: 10.00,
    isLowBalance: false,
    autoReloadEnabled: true,
    autoReloadAmount: 50.00,
    lastDepositAt: '2026-09-02T08:15:00Z',
    recentPayments: []
  }
};

function getLocalBalancesMap(): Record<string, TherapistBillingStatus> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.THERAPIST_BALANCES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {}
  return { ...INITIAL_DEMO_BALANCES };
}

function saveLocalBalancesMap(map: Record<string, TherapistBillingStatus>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.THERAPIST_BALANCES, JSON.stringify(map));
  } catch (e) {}
}

export function getTherapistBalanceLocal(therapistId: string): TherapistBillingStatus {
  const map = getLocalBalancesMap();
  if (map[therapistId]) {
    return map[therapistId];
  }
  const newRec: TherapistBillingStatus = {
    therapistId,
    balanceEur: 20.00,
    totalDepositedEur: 20.00,
    lowBalanceThreshold: 5.00,
    isLowBalance: false,
    autoReloadEnabled: false,
    autoReloadAmount: 20.00,
    lastDepositAt: new Date().toISOString(),
    recentPayments: []
  };
  map[therapistId] = newRec;
  saveLocalBalancesMap(map);
  return newRec;
}

export function topUpTherapistBalanceLocal(params: {
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  amountEur: number;
  type?: 'initial_deposit' | 'manual_reload' | 'auto_reload' | 'package_purchase';
  note?: string;
}): TherapistBillingStatus {
  const map = getLocalBalancesMap();
  const current = map[params.therapistId] || getTherapistBalanceLocal(params.therapistId);
  const amount = Math.max(0, Number(params.amountEur) || 0);

  const updated: TherapistBillingStatus = {
    ...current,
    balanceEur: Math.round((current.balanceEur + amount) * 100) / 100,
    totalDepositedEur: Math.round((current.totalDepositedEur + amount) * 100) / 100,
    isLowBalance: (current.balanceEur + amount) <= current.lowBalanceThreshold,
    lastDepositAt: new Date().toISOString(),
  };
  map[params.therapistId] = updated;
  saveLocalBalancesMap(map);

  // Also add local payment entry
  try {
    const rawPayments = localStorage.getItem(LOCAL_STORAGE_KEYS.BILLING_PAYMENTS);
    const paymentsList: BillingDepositRecord[] = rawPayments ? JSON.parse(rawPayments) : [...DEFAULT_SEED_PAYMENTS];
    const newPayment: BillingDepositRecord = {
      id: 'pay-' + Date.now(),
      therapistId: params.therapistId,
      therapistName: params.therapistName || params.therapistId,
      therapistEmail: params.therapistEmail,
      amountEur: amount,
      type: params.type || 'manual_reload',
      status: 'succeeded',
      createdAt: new Date().toISOString(),
      month: new Date().toISOString().slice(0, 7),
      note: params.note || `Guthaben-Aufladung: +${amount.toFixed(2)} €`
    };
    paymentsList.unshift(newPayment);
    localStorage.setItem(LOCAL_STORAGE_KEYS.BILLING_PAYMENTS, JSON.stringify(paymentsList.slice(0, 50)));
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('homoeo_billing_balance_changed'));
  }
  return updated;
}

export function updateTherapistSettingsLocal(params: {
  therapistId: string;
  lowBalanceThreshold?: number;
  autoReloadEnabled?: boolean;
  autoReloadAmount?: number;
}): TherapistBillingStatus {
  const map = getLocalBalancesMap();
  const current = map[params.therapistId] || getTherapistBalanceLocal(params.therapistId);
  const updated: TherapistBillingStatus = {
    ...current,
    lowBalanceThreshold: params.lowBalanceThreshold !== undefined ? Math.max(0, params.lowBalanceThreshold) : current.lowBalanceThreshold,
    autoReloadEnabled: params.autoReloadEnabled !== undefined ? params.autoReloadEnabled : current.autoReloadEnabled,
    autoReloadAmount: params.autoReloadAmount !== undefined ? Math.max(5, params.autoReloadAmount) : current.autoReloadAmount,
  };
  updated.isLowBalance = updated.balanceEur <= updated.lowBalanceThreshold;
  map[params.therapistId] = updated;
  saveLocalBalancesMap(map);
  return updated;
}

export async function createCheckoutSession(params: {
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  amountEur: number;
  type?: 'initial_deposit' | 'manual_reload' | 'auto_reload' | 'package_purchase';
  targetTariffId?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{
  sessionId: string;
  url: string;
  mode: 'stripe' | 'sandbox';
  amountEur?: number;
  fallback?: boolean;
  message?: string;
} | null> {
  const amount = Math.max(1, Number(params.amountEur) || 20);

  try {
    const res = await fetch('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('[Stripe Billing] Backend unreachable for checkout session:', err);
  }

  // Graceful local fallback if backend endpoint returned 404 or network is unavailable
  const mockSessionId = 'cs_sandbox_' + Date.now();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = params.successUrl || `${origin}/?payment=success&session_id=${mockSessionId}&therapistId=${params.therapistId}`;

  return {
    sessionId: mockSessionId,
    url: successUrl,
    mode: 'sandbox',
    amountEur: amount,
    fallback: true,
    message: `Testmodus / Sandbox: Weiterleitung zur Bestätigung.`
  };
}

export async function verifyStripeCheckoutSession(sessionId: string, therapistId?: string): Promise<{
  success: boolean;
  status?: string;
  amountEur?: number;
  therapistId?: string;
  targetTariffId?: string;
  type?: string;
  message?: string;
}> {
  if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}' || sessionId.includes('CHECKOUT_SESSION_ID')) {
    return { success: false, message: 'Keine gültige Session-ID übergeben' };
  }

  try {
    const res = await fetch(`/api/billing/verify-session?sessionId=${encodeURIComponent(sessionId)}&therapistId=${encodeURIComponent(therapistId || '')}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.credited && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('homoeo_billing_balance_changed'));
      }
      return data;
    }
  } catch (err) {
    console.warn('[Stripe Billing] Failed to verify checkout session with server:', err);
  }

  // If in sandbox mode or test mode
  if (sessionId.startsWith('cs_sandbox_') || sessionId.startsWith('cs_offline_')) {
    return {
      success: true,
      status: 'complete',
      amountEur: 20,
      therapistId: therapistId || 'th-101',
      message: 'Sandbox-Zahlung bestätigt'
    };
  }

  return {
    success: false,
    message: 'Zahlungsüberprüfung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.'
  };
}

export async function fetchTherapistBillingStatus(therapistId: string): Promise<TherapistBillingStatus> {
  const local = getTherapistBalanceLocal(therapistId);
  try {
    const res = await fetch(`/api/therapist/billing/${therapistId}`);
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object' && serverData.therapistId) {
        const map = getLocalBalancesMap();
        map[therapistId] = {
          ...local,
          ...serverData
        };
        saveLocalBalancesMap(map);
        return map[therapistId];
      }
    }
  } catch (err) {
    // Network or server offline
  }
  return local;
}

export async function topUpTherapistBalance(params: {
  therapistId: string;
  therapistName?: string;
  therapistEmail?: string;
  amountEur: number;
  type?: 'initial_deposit' | 'manual_reload' | 'auto_reload' | 'package_purchase';
  note?: string;
}): Promise<boolean> {
  topUpTherapistBalanceLocal(params);
  try {
    const res = await fetch('/api/therapist/billing/top-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync top-up to server:', err);
  }
  return true;
}

export async function updateTherapistBillingSettings(params: {
  therapistId: string;
  lowBalanceThreshold?: number;
  autoReloadEnabled?: boolean;
  autoReloadAmount?: number;
}): Promise<boolean> {
  updateTherapistSettingsLocal(params);
  try {
    const res = await fetch('/api/therapist/billing/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to sync billing settings to server:', err);
  }
  return true;
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
