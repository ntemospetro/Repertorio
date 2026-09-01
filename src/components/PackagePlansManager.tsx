import React, { useState, useEffect } from 'react';
import { RegistrationTrialConfigEditor } from "./RegistrationTrialConfigEditor";
import { PackagePlan, TariffBillingPeriod } from '../types';
import { 
  getPackagePlans, 
  createPackagePlan, 
  updatePackagePlan, 
  deletePackagePlan,
  getTherapists
} from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  Package, 
  Plus, 
  Sparkles, 
  Check, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Users, 
  Layers, 
  Infinity as InfinityIcon,
  FileCheck,
  Sliders,
  X,
  Star,
  AlertCircle
} from 'lucide-react';

interface PackagePlansManagerProps {
  onAssignTariffToTherapist?: (planId: string) => void;
}

export const PackagePlansManager: React.FC<PackagePlansManagerProps> = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PackagePlan[]>(getPackagePlans());
  const [therapists, setTherapists] = useState(getTherapists());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PackagePlan | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'trial' | 'packages'>('trial');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: 49,
    currency: '€',
    billingPeriod: 'monthly' as TariffBillingPeriod,
    maxAnalyses: 50,
    isUnlimited: false,
    badge: '',
    description: '',
    featuresText: '',
    isDefault: false,
    isActive: true,
  });

  const refreshData = () => {
    setPlans(getPackagePlans());
    setTherapists(getTherapists());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('homoeo_packages_updated', refreshData);
    window.addEventListener('homoeo_storage_updated', refreshData);
    return () => {
      window.removeEventListener('homoeo_packages_updated', refreshData);
      window.removeEventListener('homoeo_storage_updated', refreshData);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      price: 29,
      currency: '€',
      billingPeriod: 'monthly',
      maxAnalyses: 25,
      isUnlimited: false,
      badge: 'Praxis-Tarif',
      description: 'Flexibles Analysepaket für den Praxisalltag.',
      featuresText: '25 Vollanalysen inklusive\nPrioritäre Repertorisation\nPDF-Fallexport',
      isDefault: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: PackagePlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      currency: plan.currency || '€',
      billingPeriod: plan.billingPeriod,
      maxAnalyses: plan.isUnlimited ? 50 : plan.maxAnalyses,
      isUnlimited: plan.isUnlimited,
      badge: plan.badge || '',
      description: plan.description || '',
      featuresText: (plan.features || []).join('\n'),
      isDefault: plan.isDefault || false,
      isActive: plan.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDeletePlan = (plan: PackagePlan) => {
    const assignedCount = therapists.filter(th => th.tarif === plan.id || th.tarifId === plan.id).length;
    if (assignedCount > 0) {
      if (!window.confirm(`Warnung: Aktuell nutzen ${assignedCount} Therapeut(en) dieses Paket (${plan.name}). Möchten Sie das Paket wirklich löschen?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Paket "${plan.name}" wirklich löschen?`)) {
        return;
      }
    }

    const success = deletePackagePlan(plan.id);
    if (success) {
      showToast(`Paket "${plan.name}" erfolgreich gelöscht`);
    } else {
      alert('Das letzte verbleibende Paket kann nicht gelöscht werden.');
    }
  };

  const handleSetDefault = (planId: string, planName: string) => {
    updatePackagePlan(planId, { isDefault: true });
    showToast(`"${planName}" als Standard-Tarif für Neuanmeldungen gesetzt`);
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Bitte geben Sie einen Paketnamen ein.');
      return;
    }

    const features = formData.featuresText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const priceNum = Math.max(0, Number(formData.price) || 0);
    const maxAnalysesNum = formData.isUnlimited ? 999999 : Math.max(1, Number(formData.maxAnalyses) || 1);

    if (editingPlan) {
      // Update
      updatePackagePlan(editingPlan.id, {
        name: formData.name.trim(),
        price: priceNum,
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        maxAnalyses: maxAnalysesNum,
        isUnlimited: formData.isUnlimited,
        badge: formData.badge.trim() || undefined,
        description: formData.description.trim() || undefined,
        features,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      });
      showToast(`Paket "${formData.name}" erfolgreich aktualisiert`);
    } else {
      // Create
      createPackagePlan({
        name: formData.name.trim(),
        price: priceNum,
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        maxAnalyses: maxAnalysesNum,
        isUnlimited: formData.isUnlimited,
        badge: formData.badge.trim() || undefined,
        description: formData.description.trim() || undefined,
        features,
        isDefault: formData.isDefault,
        isActive: formData.isActive,
      });
      showToast(`Neues Paket "${formData.name}" erfolgreich erstellt`);
    }

    setIsModalOpen(false);
  };

  const getBillingPeriodLabel = (period: TariffBillingPeriod, price: number) => {
    if (price === 0 || period === 'free') return 'Kostenlos';
    switch (period) {
      case 'one_time':
        return 'Einmalig';
      case 'monthly':
        return '/ Monat';
      case 'yearly':
        return '/ Jahr';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white border-0 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Tarif- & Paket-Konfigurator
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                {plans.length} Pakete aktiv
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Konfigurieren Sie den Registrierungs-Testtarif und stellen Sie maßgeschneiderte Praxis-Tarife für Therapeuten bereit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="admin-btn-create-package"
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Paket erstellen</span>
          </button>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/90">
        <button
          type="button"
          id="btn-subtab-reg-trial"
          onClick={() => setActiveSection('trial')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'trial'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Registrierungs-Testtarif (Live-Texte & Übersetzungen)</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
            activeSection === 'trial' ? 'bg-teal-800 text-teal-100' : 'bg-teal-100 text-teal-800'
          }`}>
            Live
          </span>
        </button>

        <button
          type="button"
          id="btn-subtab-packages-list"
          onClick={() => setActiveSection('packages')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'packages'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-teal-600" />
          <span>Zusatzpakete & Flatrates ({plans.length})</span>
        </button>
      </div>

      {/* 1. Registration Trial Configurator Section */}
      {activeSection === 'trial' && (
        <div className="space-y-3">
          <RegistrationTrialConfigEditor 
            onSaved={() => showToast('Testtarif-Konfiguration erfolgreich aktualisiert!')} 
          />
        </div>
      )}

      {/* 2. Paid / Custom Packages Section */}
      {activeSection === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Zusatz- & Praxis-Pakete für Therapeuten ({plans.length})
              </h3>
            </div>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const assignedTherapists = therapists.filter(
            th => th.tarif === plan.id || th.tarifId === plan.id
          );
          const isFlatrate = plan.isUnlimited || plan.maxAnalyses >= 900000;

          return (
            <div
              key={plan.id}
              className={`card flex flex-col justify-between p-5 relative transition-all border ${
                plan.isDefault
                  ? 'border-teal-500 shadow-md ring-1 ring-teal-500/20 bg-teal-50/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Badges row */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {plan.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-teal-600" />
                      <span>{plan.badge}</span>
                    </span>
                  )}
                  {plan.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                      <span>Standard-Tarif</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(plan)}
                    title="Paket bearbeiten"
                    className="p-1 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {plans.length > 1 && (
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      title="Paket löschen"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Price */}
              <div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {plan.name}
                </h3>
                
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {plan.price === 0 ? '0 €' : `${plan.price} ${plan.currency || '€'}`}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {getBillingPeriodLabel(plan.billingPeriod, plan.price)}
                  </span>
                </div>

                {/* Analysis Quota Box */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                  {isFlatrate ? (
                    <>
                      <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <InfinityIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">Unbegrenzte Analysen</div>
                        <div className="text-[10px] text-slate-500">Flatrate ohne Begrenzung</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-7 h-7 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-900">
                          {plan.maxAnalyses} Vollanalysen
                        </div>
                        <div className="text-[10px] text-slate-500">Kontingent pro Therapeut</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {plan.description}
                  </p>
                )}

                {/* Features List */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="mt-3 space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Card Footer: Usage count & Default toggle */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-800">{assignedTherapists.length}</strong> Nutzer
                  </span>
                </div>

                {!plan.isDefault && (
                  <button
                    onClick={() => handleSetDefault(plan.id, plan.name)}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold hover:underline cursor-pointer"
                  >
                    Als Standard
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}

      {/* MODAL: Create / Edit Package Plan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {editingPlan ? 'Paket bearbeiten' : 'Neues Paket zusammenstellen'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definieren Sie Tarifpreis, Analysen-Kontingent und Konditionen.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePlan} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Paketname */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Paketname *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Praxis-Flatrate, 25er Block, Starter..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-teal-600 text-xs font-semibold text-slate-900 h-[38px]"
                />
              </div>

              {/* Price & Billing Period */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Tarifpreis (€) *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-teal-600 font-mono text-sm font-bold text-slate-900 h-[38px]"
                    />
                    <span className="text-slate-500 font-bold px-1.5">€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Abrechnungszeitraum
                  </label>
                  <select
                    value={formData.billingPeriod}
                    onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value as TariffBillingPeriod })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:border-teal-600 font-medium text-slate-800 h-[38px]"
                  >
                    <option value="free">Kostenlos (0 €)</option>
                    <option value="one_time">Einmalig (Prepaid-Block)</option>
                    <option value="monthly">Monatlich (Abo)</option>
                    <option value="yearly">Jährlich</option>
                  </select>
                </div>
              </div>

              {/* Analysis Quota */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Analysen-Anzahl / Kontingent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isUnlimited}
                      onChange={(e) => setFormData({ ...formData, isUnlimited: e.target.checked })}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-teal-800 flex items-center gap-1">
                      <InfinityIcon className="w-3.5 h-3.5 text-teal-600" />
                      Unbegrenzt (Flatrate)
                    </span>
                  </label>
                </div>

                {!formData.isUnlimited ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={formData.maxAnalyses}
                        onChange={(e) => setFormData({ ...formData, maxAnalyses: Math.max(1, Number(e.target.value)) })}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-600 h-[38px]"
                      />
                      <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                        Analysen pro Nutzer
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Der Nutzer wird nach Erreichen dieses Limits automatisch gesperrt, bis er ein Upgrade erhält.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-teal-700 bg-teal-50 p-2 rounded border border-teal-200">
                    Therapeuten mit diesem Tarif können unbegrenzt viele Patienten aufnehmen und analysieren.
                  </p>
                )}
              </div>

              {/* Badge & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Badge / Label (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Beliebt, Empfohlen, Aktion"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-teal-600 text-xs text-slate-900 h-[38px]"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Standard für Neuregistrierungen
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Kurzbeschreibung
                </label>
                <textarea
                  rows={2}
                  placeholder="Erklären Sie den Zweck dieses Pakets..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-teal-600 text-xs text-slate-900 resize-none"
                />
              </div>

              {/* Feature Points */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Leistungsmerkmale (ein Punkt pro Zeile)
                </label>
                <textarea
                  rows={3}
                  placeholder="z.B.&#10;50 Vollanalysen monatlich&#10;Prioritäts-Repertorisation&#10;Persönlicher Support"
                  value={formData.featuresText}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-teal-600 text-xs font-mono text-slate-900"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPlan ? (t('saveChanges') || 'Änderungen speichern') : (t('createPackage') || 'Paket anlegen')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
