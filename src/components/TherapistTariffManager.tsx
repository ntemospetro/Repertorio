import React, { useState } from 'react';
import { Therapist, PackagePlan } from '../types';
import { getPackagePlans, assignPackageToTherapist } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Zap, 
  Infinity as InfinityIcon, 
  Layers, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface TherapistTariffManagerProps {
  therapist: Therapist;
  onTariffChanged?: (updated: Therapist) => void;
}

export const TherapistTariffManager: React.FC<TherapistTariffManagerProps> = ({
  therapist,
  onTariffChanged
}) => {
  const { t } = useTranslation();
  const packagePlans = getPackagePlans();

  const [resetUsageOnSwitch, setResetUsageOnSwitch] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSwitchTariff = (plan: PackagePlan) => {
    if (plan.id === (therapist.tarifId || therapist.tarif)) {
      return;
    }

    const updated = assignPackageToTherapist(therapist.id, plan.id, resetUsageOnSwitch);
    if (updated) {
      if (onTariffChanged) onTariffChanged(updated);
      setSuccessMessage(`Erfolgreich auf den Tarif "${plan.name}" gewechselt!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const isUnlimited = therapist.isUnlimited || therapist.tarif === 'pro_unlimited' || therapist.maxAnalyses >= 900000;
  const used = therapist.usedAnalyses;
  const max = therapist.maxAnalyses;
  const remaining = isUnlimited ? Infinity : Math.max(0, max - used);
  const percentUsed = isUnlimited ? 100 : Math.min(100, Math.round((used / max) * 100));

  return (
    <div className="space-y-8 animate-fadeIn" id="therapist-tariff-manager">
      {/* 1. HERO CARD: AKTIV ENTSPRECHENDER TARIF */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              {t('tariffCurrentPlan')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              {therapist.tarifLabel || 'Kostenloser Test-Tarif'}
              {isUnlimited ? (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <InfinityIcon className="w-3.5 h-3.5" /> Flatrate
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {max} Analysen
                </span>
              )}
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              {isUnlimited 
                ? 'Sie nutzen die unbegrenzte Praxis-Lizenz ohne Analyselimit. Alle Repertorisationsfunktionen und Fallaufnahmen stehen unbeschränkt zur Verfügung.'
                : `Aktives Kontingent für homöopathische Fallrepertorisationen. Verbleibend: ${remaining} von ${max} Vollanalysen.`}
            </p>
          </div>

          {/* Meter Box */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 min-w-[240px]">
            <div className="text-xs text-slate-300 font-medium flex items-center justify-between mb-2">
              <span>Nutzungskontingent</span>
              <span className="font-bold text-white">
                {isUnlimited ? 'Unbegrenzt' : `${used} / ${max}`}
              </span>
            </div>

            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden mb-2">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnlimited 
                    ? 'bg-emerald-400 w-full' 
                    : percentUsed >= 100 
                    ? 'bg-rose-500' 
                    : percentUsed >= 66 
                    ? 'bg-amber-400' 
                    : 'bg-teal-400'
                }`}
                style={{ width: isUnlimited ? '100%' : `${percentUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                {isUnlimited ? 'Keine Beschränkung' : `${remaining} verbleibend`}
              </span>
              <span className="text-teal-300 font-semibold">
                {isUnlimited ? '100% aktiv' : `${percentUsed}% verbraucht`}
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-6 p-3.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center gap-2 text-sm text-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* 2. TARIF-WECHSEL BEREICH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              {t('tariffSwitchPlan')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Wählen Sie den passenden Tarif für Ihre Praxisauslastung. Ein Wechsel wird sofort wirksam.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={resetUsageOnSwitch}
              onChange={(e) => setResetUsageOnSwitch(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              {t('tariffResetCounter')}
            </span>
          </label>
        </div>

        {/* Tarife Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packagePlans.map((plan) => {
            const isCurrent = (therapist.tarifId || therapist.tarif) === plan.id;
            const isHighlighted = plan.badge === 'Beliebt' || plan.badge === 'Flatrate' || plan.isUnlimited;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'border-2 border-teal-600 bg-teal-50/30 shadow-md ring-4 ring-teal-600/10'
                    : isHighlighted
                    ? 'border-2 border-teal-400 bg-white shadow-sm hover:shadow-md'
                    : 'border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {/* Popular / Active Badge */}
                <div className="flex items-center justify-between mb-4">
                  {isCurrent ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-600 text-white flex items-center gap-1 shadow-sm">
                      <Check className="w-3.5 h-3.5" /> {t('tariffActiveBadge')}
                    </span>
                  ) : plan.badge ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> {plan.badge}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Tarifoption
                    </span>
                  )}

                  {plan.isUnlimited ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      Unbegrenzt
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      {plan.maxAnalyses} Analysen
                    </span>
                  )}
                </div>

                {/* Plan Info */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 pb-3 border-y border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        {plan.price === 0 ? '0 €' : `€${plan.price}`}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {plan.billingPeriod === 'monthly' ? '/ Monat' : plan.billingPeriod === 'yearly' ? '/ Jahr' : 'dauerhaft'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 py-2 text-xs text-slate-600">
                    {(plan.features || []).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <div className="pt-6 mt-4">
                  {isCurrent ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-teal-100 text-teal-800 text-center font-semibold text-xs flex items-center justify-center gap-2">
                      <Check className="w-4 h-4 text-teal-700" />
                      Aktuell aktiviert
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSwitchTariff(plan)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                        isHighlighted
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{t('tariffChangeBtn')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
