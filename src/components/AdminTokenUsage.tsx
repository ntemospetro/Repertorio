import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import {
  Coins,
  RefreshCw,
  Download,
  Search,
  Filter,
  TrendingUp,
  Database,
  Cpu,
  Receipt,
  RotateCcw,
  Sliders,
  CheckCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Activity
} from 'lucide-react';
import {
  TokenBillingSummary,
  TokenUsageRecord,
  TherapistTokenSummary,
  TokenPricingRates
} from '../types';
import {
  fetchTokenBillingSummary,
  fetchTokenLogs,
  updateTokenRates,
  resetTokenLogs,
  exportTokenBillingCsv,
  formatCostEur,
  formatTokenCount
} from '../services/tokenBillingService';

export const AdminTokenUsage: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<TokenBillingSummary | null>(null);
  const [logs, setLogs] = useState<TokenUsageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'therapists' | 'logs' | 'rates'>('therapists');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTherapistId, setFilterTherapistId] = useState<string>('all');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rate Editing
  const [editingRates, setEditingRates] = useState<TokenPricingRates>({
    inputPerMillionEur: 0.075,
    outputPerMillionEur: 0.30,
    currency: '€'
  });
  const [savingRates, setSavingRates] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const summaryData = await fetchTokenBillingSummary();
      setSummary(summaryData);
      setEditingRates(summaryData.rates);

      const logsData = await fetchTokenLogs(filterTherapistId, 250);
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load token billing data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterTherapistId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh interval every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRates(true);
    try {
      const updated = await updateTokenRates(editingRates);
      if (updated) {
        setEditingRates(updated);
        showToast(t('adminTokensRatesSaved'));
        loadData(true);
      }
    } catch (err) {
      console.error('Failed to save token rates:', err);
    } finally {
      setSavingRates(false);
    }
  };

  const handleResetLogs = async () => {
    try {
      await resetTokenLogs();
      setIsResetConfirmOpen(false);
      showToast('Token-Verbrauchsprotokoll erfolgreich zurückgesetzt');
      loadData();
    } catch (err) {
      console.error('Failed to reset logs:', err);
    }
  };

  const handleExportCsv = () => {
    if (!summary) return;
    exportTokenBillingCsv(summary);
  };

  // Filter therapists
  const filteredTherapists = (summary?.byTherapist || []).filter((th) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      th.therapistName.toLowerCase().includes(q) ||
      th.therapistEmail.toLowerCase().includes(q) ||
      th.praxisName.toLowerCase().includes(q) ||
      th.tarifLabel.toLowerCase().includes(q)
    );
  });

  const avgCostPerRequest =
    summary && summary.totalRequests > 0
      ? summary.totalCostEur / summary.totalRequests
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-teal-500/30 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {t('adminTokensTitle')}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('adminTokensRealtimeActive')}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {t('adminTokensSubtitle')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              title={t('adminTokensRefresh')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-400' : ''}`} />
              <span>{t('adminTokensRefresh')}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('adminTokensExportCsv')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="p-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700/50 transition-all cursor-pointer"
              title={t('adminTokensResetLogs')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
          {/* Card 1: Total Cost */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('adminTokensTotalCost')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-teal-300 mt-2 font-mono">
              {formatCostEur(summary?.totalCostEur || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Gesamtausgaben aller Modelle
            </div>
          </div>

          {/* Card 2: Total Tokens */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('adminTokensTotalTokens')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
              {formatTokenCount(summary?.totalTokens || 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-300">In: {formatTokenCount(summary?.totalPromptTokens || 0)}</span>
              <span>•</span>
              <span className="text-slate-300">Out: {formatTokenCount(summary?.totalCandidatesTokens || 0)}</span>
            </div>
          </div>

          {/* Card 3: Total Requests */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('adminTokensTotalRequests')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-sky-300 mt-2 font-mono">
              {summary?.totalRequests || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Erfasste API-Aufrufe
            </div>
          </div>

          {/* Card 4: Avg Cost per Request */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('adminTokensAvgCostPerReq')}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-2 font-mono">
              {formatCostEur(avgCostPerRequest)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Google Gemini 3.8 Flash
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1 border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('therapists')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'therapists'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{t('adminTokensTabTherapists')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {summary?.byTherapist?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t('adminTokensTabLogs')}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rates')}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'rates'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t('adminTokensTabRates')}</span>
        </button>
      </div>

      {/* Sub-Tab 1: Therapists Breakdown Table (Users listed downwards with tokens & costs) */}
      {activeSubTab === 'therapists' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('adminTokensSearchPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 self-end sm:self-auto">
              <span>{filteredTherapists.length} Therapeuten gelistet</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{t('adminTokensColTherapist')}</th>
                  <th className="py-3.5 px-4">{t('adminTokensColTariff')}</th>
                  <th className="py-3.5 px-4 text-center">{t('adminTokensColRequests')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminTokensColPromptTokens')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminTokensColCandidatesTokens')}</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-900">{t('adminTokensColTotalTokens')}</th>
                  <th className="py-3.5 px-4 text-right font-bold text-teal-700 bg-teal-50/50">{t('adminTokensColCost')}</th>
                  <th className="py-3.5 px-4">{t('adminTokensColLastUsed')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTherapists.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {t('adminTokensNoTherapistsFound')}
                    </td>
                  </tr>
                ) : (
                  filteredTherapists.map((th) => {
                    const isZeroUsage = th.requestCount === 0;

                    return (
                      <tr
                        key={th.therapistId}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Therapist / Praxis */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-sm">
                            {th.therapistName}
                          </div>
                          {th.praxisName && (
                            <div className="text-[11px] text-slate-500">
                              {th.praxisName}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono">
                            {th.therapistEmail}
                          </div>
                        </td>

                        {/* Tariff */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {th.tarifLabel || 'Standard'}
                          </span>
                        </td>

                        {/* Request Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs">
                            {th.requestCount}
                          </span>
                        </td>

                        {/* Input Tokens */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {formatTokenCount(th.promptTokens)}
                        </td>

                        {/* Output Tokens */}
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          {formatTokenCount(th.candidatesTokens)}
                        </td>

                        {/* Total Tokens */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatTokenCount(th.totalTokens)}
                        </td>

                        {/* Cost to Me */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 bg-teal-50/40 group-hover:bg-teal-50/80">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-100/70 text-teal-800 text-xs shadow-2xs">
                            {formatCostEur(th.totalCostEur)}
                          </span>
                        </td>

                        {/* Last Activity */}
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {th.lastUsedAt ? (
                            <div>
                              <div>{new Date(th.lastUsedAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {new Date(th.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Noch keine</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Live Request Log Table */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">{t('adminTokensFilterTherapist')}:</span>
              <select
                value={filterTherapistId}
                onChange={(e) => setFilterTherapistId(e.target.value)}
                className="text-xs bg-white rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">{t('adminTokensAllTherapists')}</option>
                {(summary?.byTherapist || []).map((th) => (
                  <option key={th.therapistId} value={th.therapistId}>
                    {th.therapistName} ({th.requestCount} Aufrufe)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Die letzten {logs.length} Aufrufe
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{t('adminTokensColTime')}</th>
                  <th className="py-3.5 px-4">{t('adminTokensColTherapist')}</th>
                  <th className="py-3.5 px-4">{t('adminTokensColAction')}</th>
                  <th className="py-3.5 px-4">{t('adminTokensColModel')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminTokensColPromptTokens')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminTokensColCandidatesTokens')}</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-900">{t('adminTokensColTotalTokens')}</th>
                  <th className="py-3.5 px-4 text-right font-bold text-teal-700 bg-teal-50/50">{t('adminTokensColCost')}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      {t('adminTokensNoLogs')}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors font-mono">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Therapist */}
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{log.therapistName}</div>
                        <div className="text-[10px] text-slate-400">{log.therapistEmail}</div>
                      </td>

                      {/* Action / Endpoint */}
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200/60 font-medium text-[11px]">
                          <Sparkles className="w-3 h-3 text-sky-500" />
                          {log.actionName || log.endpoint}
                        </span>
                      </td>

                      {/* Model */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {log.model}
                      </td>

                      {/* Input Tokens */}
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatTokenCount(log.promptTokens)}
                      </td>

                      {/* Output Tokens */}
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatTokenCount(log.candidatesTokens)}
                      </td>

                      {/* Total Tokens */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatTokenCount(log.totalTokens)}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-bold text-teal-700 bg-teal-50/40">
                        <span className="px-2 py-0.5 rounded-md bg-teal-100/80 text-teal-900">
                          {formatCostEur(log.costEur)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Rate Configuration Card */}
      {activeSubTab === 'rates' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {t('adminTokensTabRates')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('adminTokensRatesDesc')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('adminTokensRateInputLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingRates.inputPerMillionEur}
                    onChange={(e) =>
                      setEditingRates({
                        ...editingRates,
                        inputPerMillionEur: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    € / 1M
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standard: 0.075 € (Gemini 3.8 Flash)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t('adminTokensRateOutputLabel')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editingRates.outputPerMillionEur}
                    onChange={(e) =>
                      setEditingRates({
                        ...editingRates,
                        outputPerMillionEur: parseFloat(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                    € / 1M
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standard: 0.300 € (Gemini 3.8 Flash)</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setEditingRates({
                    inputPerMillionEur: 0.075,
                    outputPerMillionEur: 0.30,
                    currency: '€'
                  })
                }
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Auf Google-Standard zurücksetzen
              </button>

              <button
                type="submit"
                disabled={savingRates}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {savingRates && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{t('adminTokensSaveRates')}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reset Confirmation */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                {t('adminTokensResetConfirmTitle')}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('adminTokensResetConfirmDesc')}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleResetLogs}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {t('adminTokensResetLogs')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
