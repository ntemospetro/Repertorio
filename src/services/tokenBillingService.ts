import { TokenBillingSummary, TokenPricingRates, TokenUsageRecord } from '../types';

export const DEFAULT_TOKEN_RATES: TokenPricingRates = {
  inputPerMillionEur: 0.075,
  outputPerMillionEur: 0.30,
  currency: '€'
};

export async function fetchTokenBillingSummary(): Promise<TokenBillingSummary> {
  try {
    const res = await fetch('/api/admin/tokens/summary');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Failed to fetch token billing summary from server:', err);
  }

  // Fallback empty structure
  return {
    totalPromptTokens: 0,
    totalCandidatesTokens: 0,
    totalTokens: 0,
    totalCostEur: 0,
    totalRequests: 0,
    byTherapist: [],
    rates: DEFAULT_TOKEN_RATES,
    lastUpdated: new Date().toISOString()
  };
}

export async function fetchTokenLogs(therapistId?: string, limit: number = 100): Promise<TokenUsageRecord[]> {
  try {
    const params = new URLSearchParams();
    if (therapistId && therapistId !== 'all') params.append('therapistId', therapistId);
    params.append('limit', limit.toString());

    const res = await fetch(`/api/admin/tokens/logs?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('Failed to fetch token logs from server:', err);
  }
  return [];
}

export async function updateTokenPricingRates(rates: Partial<TokenPricingRates>): Promise<TokenPricingRates> {
  try {
    const res = await fetch('/api/admin/tokens/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rates)
    });
    if (res.ok) {
      const data = await res.json();
      return data.rates;
    }
  } catch (err) {
    console.warn('Failed to update token pricing rates:', err);
  }
  return DEFAULT_TOKEN_RATES;
}

export async function resetTokenUsageLogs(): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/tokens/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to reset token usage logs:', err);
    return false;
  }
}

/**
 * Format numbers cleanly (e.g. 12,450)
 */
export function formatTokenNumber(num: number): string {
  return new Intl.NumberFormat('de-DE').format(Math.round(num));
}

/**
 * Format currency with high precision (e.g. 0,0842 €)
 */
export function formatTokenCost(costEur: number, currency: string = '€'): string {
  if (costEur === 0) return `0,0000 ${currency}`;
  if (costEur < 0.01) {
    return `${costEur.toFixed(4).replace('.', ',')} ${currency}`;
  }
  return `${costEur.toFixed(3).replace('.', ',')} ${currency}`;
}

/**
 * Generates and downloads a CSV export of the therapist token billing
 */
export function exportTokenBillingCSV(summary: TokenBillingSummary): void {
  const headers = [
    'Therapeut-ID',
    'Name',
    'Praxis',
    'E-Mail',
    'Tarif',
    'Anzahl_Anfragen',
    'Input_Tokens',
    'Output_Tokens',
    'Gesamt_Tokens',
    'Gesamtkosten_EUR',
    'Letzte_Nutzung'
  ];

  const rows = summary.byTherapist.map(t => [
    `"${t.therapistId}"`,
    `"${t.therapistName}"`,
    `"${t.praxisName || ''}"`,
    `"${t.therapistEmail}"`,
    `"${t.tarifLabel || ''}"`,
    t.requestCount,
    t.promptTokens,
    t.candidatesTokens,
    t.totalTokens,
    t.totalCostEur.toFixed(4),
    `"${t.lastUsedAt}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `token_abrechnung_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Aliases for convenience
export const updateTokenRates = updateTokenPricingRates;
export const resetTokenLogs = resetTokenUsageLogs;
export const exportTokenBillingCsv = exportTokenBillingCSV;
export const formatCostEur = formatTokenCost;
export const formatTokenCount = formatTokenNumber;

