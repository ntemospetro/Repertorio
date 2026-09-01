import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  ShieldCheck, 
  Languages, 
  ArrowRight, 
  ClipboardList,
  Sparkles,
  CheckCircle2,
  Lock,
  Infinity as InfinityIcon,
  Check,
  Activity,
  FileText,
  Layers,
  Scale,
  Search,
  BookOpen,
  HeartHandshake,
  Clock,
  ChevronRight,
  Shield,
  Stethoscope
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { PackagePlan } from '../types';
import { getPackagePlans, getLocalizedRegistrationTrial } from '../services/storage';

interface LandingPageProps {
  onGetStarted: () => void;
  onGoToLogin: () => void;
}

export function LandingPage({ onGetStarted, onGoToLogin }: LandingPageProps) {
  const { t, language } = useTranslation();
  const [plans, setPlans] = useState<PackagePlan[]>([]);
  const trialConfig = getLocalizedRegistrationTrial(language);

  const getLocalizedPlanInfo = (plan: PackagePlan) => {
    if (plan.id === 'starter_10') {
      return {
        name: t('planStarterName'),
        badge: t('planStarterBadge'),
        description: t('planStarterDesc'),
        features: [t('planStarterF1'), t('planStarterF2'), t('planStarterF3')]
      };
    }
    if (plan.id === 'praxis_50') {
      return {
        name: t('planPraxisName'),
        badge: t('planPraxisBadge'),
        description: t('planPraxisDesc'),
        features: [t('planPraxisF1'), t('planPraxisF2'), t('planPraxisF3')]
      };
    }
    if (plan.id === 'pro_unlimited') {
      return {
        name: t('planProName'),
        badge: t('planProBadge'),
        description: t('planProDesc'),
        features: [t('planProF1'), t('planProF2'), t('planProF3'), t('planProF4')]
      };
    }
    return {
      name: plan.name,
      badge: plan.badge,
      description: plan.description,
      features: plan.features || []
    };
  };

  useEffect(() => {
    // Only load active packages
    setPlans(getPackagePlans().filter(p => p.isActive));
    
    const handleUpdate = () => {
      setPlans(getPackagePlans().filter(p => p.isActive));
    };

    window.addEventListener('homoeo_saas_packages_updated', handleUpdate);
    window.addEventListener('homoeo_reg_trial_updated', handleUpdate);
    
    return () => {
      window.removeEventListener('homoeo_saas_packages_updated', handleUpdate);
      window.removeEventListener('homoeo_reg_trial_updated', handleUpdate);
    };
  }, []);

  return (
    <div id="landing-page-root" className="bg-[#FAFBFB] text-slate-800 antialiased font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. HERO SECTION */}
      <section id="landing-hero" className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/70">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#0f766e_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.035] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-teal-100/40 via-slate-100/20 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            
            {/* Professional Subtitle Pill */}
            <div id="landing-hero-pill" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold tracking-wide mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('landingSubtitle')}</span>
            </div>

            {/* Main Headline */}
            <h1 id="landing-hero-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              <span>{t('landingTitle1')}</span>
              <span className="text-teal-700 block sm:inline">{t('landingTitle2')}</span>
            </h1>

            {/* Sub-headline & Description */}
            <p id="landing-hero-sub" className="text-base sm:text-lg md:text-xl font-medium text-slate-700 mb-3">
              {t('landingHeroSub')}
            </p>
            <p id="landing-hero-desc" className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t('landingDescription')}
            </p>

            {/* Call to Actions */}
            <div id="landing-hero-cta-group" className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
              <button 
                id="landing-hero-btn-primary"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-7 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>{t('landingBtnTest')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                id="landing-hero-btn-secondary"
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-7 py-3.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 font-semibold text-base rounded-xl transition-all duration-200 shadow-sm"
              >
                {t('landingBtnLogin')}
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div id="landing-hero-trust-badges" className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t('landingBadgeGdpr')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t('landingBadgeNoCard')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{t('landingBadgeHahnemann')}</span>
              </div>
            </div>
          </div>

          {/* 1.1 LIVE CLINICAL UI PREVIEW (Simulated Hahnemannian Case Workspace) */}
          <div id="landing-hero-preview-window" className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-slate-300/80 shadow-2xl overflow-hidden">
            {/* Mock Window Top Bar */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2 truncate">
                  {t('landingPreviewHeader')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t('landingPreviewStatus')}
                </span>
              </div>
            </div>

            {/* Mock Workspace Content */}
            <div className="p-6 md:p-8 bg-slate-50/50">
              <div className="grid md:grid-cols-12 gap-6">
                
                {/* Left Column: Symptom Complex Profile */}
                <div className="md:col-span-5 space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4 text-teal-700" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        {t('landingPreviewSymptomTitle')}
                      </h4>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <span>{t('landingPreviewSymptom1')}</span>
                      </li>
                      <li className="flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                        <span>{t('landingPreviewSymptom2')}</span>
                      </li>
                      <li className="flex items-start gap-2 bg-teal-50/60 p-2 rounded-lg border border-teal-100 text-teal-900 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-1.5 shrink-0" />
                        <span>{t('landingPreviewSymptom3')}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Differential Diagnosis Mini Card */}
                  <div className="bg-teal-900 text-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Scale className="w-4 h-4 text-teal-300" />
                      <h4 className="text-xs font-bold tracking-wide uppercase text-teal-200">
                        {t('landingPreviewDiffTitle')}
                      </h4>
                    </div>
                    <p className="text-xs text-teal-100/90 leading-relaxed">
                      {t('landingPreviewDiffText')}
                    </p>
                  </div>
                </div>

                {/* Right Column: Ranked Remedies & Materia Medica Matching */}
                <div className="md:col-span-7 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-teal-700" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                          {t('landingPreviewRepTitle')}
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 font-mono">
                        Hahnemannian Matching Engine
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Remedy 1 (Top Match) */}
                      <div className="p-3.5 bg-teal-50/70 border border-teal-200/90 rounded-xl relative">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-700 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                            <span className="text-sm font-bold text-slate-900">{t('landingPreviewMed1')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                              {t('landingPreviewMed1Score')}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {t('landingPreviewMed1Potency')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                          {t('landingPreviewMed1Note')}
                        </p>
                      </div>

                      {/* Remedy 2 */}
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">2</span>
                          <span className="text-sm font-medium text-slate-800">{t('landingPreviewMed2')}</span>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {t('landingPreviewMed2Score')}
                        </span>
                      </div>

                      {/* Remedy 3 */}
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center">3</span>
                          <span className="text-sm font-medium text-slate-800">{t('landingPreviewMed3')}</span>
                        </div>
                        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {t('landingPreviewMed3Score')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Materia Medica Reference: Kent / Boericke / Phatak</span>
                    <button 
                      onClick={onGetStarted}
                      className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                    >
                      <span>{t('landingBtnTest')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. TRUST PILLARS (4 Focus Areas for Classical Homeopaths) */}
      <section id="landing-trust-pillars" className="py-16 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('landingTrustHeadline')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div id="landing-trust-card-1" className="p-6 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingTrust1Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingTrust1Desc')}</p>
            </div>

            {/* Pillar 2 */}
            <div id="landing-trust-card-2" className="p-6 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingTrust2Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingTrust2Desc')}</p>
            </div>

            {/* Pillar 3 */}
            <div id="landing-trust-card-3" className="p-6 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingTrust3Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingTrust3Desc')}</p>
            </div>

            {/* Pillar 4 */}
            <div id="landing-trust-card-4" className="p-6 bg-slate-50 rounded-xl border border-slate-200/70">
              <div className="w-10 h-10 rounded-lg bg-teal-100/80 text-teal-800 flex items-center justify-center mb-4">
                <Languages className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingTrust4Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingTrust4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM VS SOLUTION (Structure instead of Information Chaos) */}
      <section id="landing-problem-solution" className="py-20 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {t('landingProblemEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-4 mb-4">
              {t('landingProblemTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('landingProblemDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Left: Classic Challenges */}
            <div id="landing-problem-card" className="bg-white p-7 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                  ✕
                </div>
                <h3 className="text-lg font-bold text-slate-900">{t('landingProblemClassicTitle')}</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
                  <span className="text-sm text-slate-700 leading-relaxed">{t('landingProblemClassic1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
                  <span className="text-sm text-slate-700 leading-relaxed">{t('landingProblemClassic2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">!</span>
                  <span className="text-sm text-slate-700 leading-relaxed">{t('landingProblemClassic3')}</span>
                </li>
              </ul>
            </div>

            {/* Right: Digital Structured Solution */}
            <div id="landing-solution-card" className="bg-slate-900 text-white p-7 rounded-2xl border border-slate-800 shadow-lg">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-white">{t('landingProblemSolutionTitle')}</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-800 text-teal-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-slate-200 leading-relaxed">{t('landingProblemSolution1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-800 text-teal-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-slate-200 leading-relaxed">{t('landingProblemSolution2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-800 text-teal-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-slate-200 leading-relaxed">{t('landingProblemSolution3')}</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CORE FEATURES & CLINICAL MODULES */}
      <section id="landing-features" className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {t('landingFeaturesEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-4">
              {t('landingFeaturesTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('landingFeaturesDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            
            {/* Module 1: Anamnesis */}
            <div id="landing-feature-card-1" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature1Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature1Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                Organon §210–230 Ready
              </div>
            </div>

            {/* Module 2: Repertorisation */}
            <div id="landing-feature-card-2" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature2Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature2Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                Hahnemann Simile Weighting
              </div>
            </div>

            {/* Module 3: Clinical Workflow */}
            <div id="landing-feature-card-3" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature3Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature3Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                Continuous Case Progress
              </div>
            </div>

            {/* Module 4: Materia Medica & Differential */}
            <div id="landing-feature-card-4" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature4Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature4Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                Keynotes & Modalities
              </div>
            </div>

            {/* Module 5: Potencies & Dosage */}
            <div id="landing-feature-card-5" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature5Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature5Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                D / C / LM / Q-Potencies
              </div>
            </div>

            {/* Module 6: Multilingual 7 Languages */}
            <div id="landing-feature-card-6" className="bg-slate-50/60 p-7 rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:bg-white transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center mb-5">
                  <Languages className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landingFeature6Title')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t('landingFeature6Desc')}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs font-semibold text-teal-700">
                DE • EN • ES • FR • IT • EL • RU
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. 3-STEP CLINICAL WORKFLOW */}
      <section id="landing-steps" className="py-20 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {t('landingStepsEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-4">
              {t('landingStepsTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('landingStepsDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative max-w-5xl mx-auto">
            {/* Step 1 */}
            <div id="landing-step-1" className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-base flex items-center justify-center mb-5 shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingStep1Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingStep1Desc')}</p>
            </div>

            {/* Step 2 */}
            <div id="landing-step-2" className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-base flex items-center justify-center mb-5 shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingStep2Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingStep2Desc')}</p>
            </div>

            {/* Step 3 */}
            <div id="landing-step-3" className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-base flex items-center justify-center mb-5 shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingStep3Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingStep3Desc')}</p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. PRACTITIONER BENEFITS */}
      <section id="landing-benefits" className="py-20 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              {t('landingBenefitsEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-4">
              {t('landingBenefitsTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('landingBenefitsDesc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Benefit 1 */}
            <div id="landing-benefit-card-1" className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingBenefit1Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingBenefit1Desc')}</p>
            </div>

            {/* Benefit 2 */}
            <div id="landing-benefit-card-2" className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingBenefit2Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingBenefit2Desc')}</p>
            </div>

            {/* Benefit 3 */}
            <div id="landing-benefit-card-3" className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingBenefit3Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingBenefit3Desc')}</p>
            </div>

            {/* Benefit 4 */}
            <div id="landing-benefit-card-4" className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t('landingBenefit4Title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t('landingBenefit4Desc')}</p>
            </div>

          </div>

        </div>
      </section>

      {/* 7. TRANSPARENT PRICING / TARIFF PACKAGES */}
      <section id="landing-pricing" className="py-24 bg-slate-50/70 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              {t('pricingTitle')}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {t('pricingSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center max-w-7xl mx-auto">
            
            {/* 1. Free Trial Package */}
            <div id="landing-plan-trial" className="bg-white rounded-2xl border-2 border-teal-600 shadow-md relative flex flex-col hover:shadow-lg transition-shadow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-700 text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
                {trialConfig.badge}
              </div>
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{trialConfig.badge}</h3>
                  <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-3xl font-extrabold tracking-tight">{trialConfig.priceDisplay}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 min-h-[36px]">{trialConfig.description}</p>
                </div>

                <div className="space-y-2.5 mt-4 flex-1">
                  {(trialConfig.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button
                    id="landing-btn-trial-start"
                    onClick={onGetStarted}
                    className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
                  >
                    {t('pricingStartFree')}
                  </button>
                </div>
              </div>
            </div>

            {/* Paid Packages (Dynamic from Storage / Admin Configuration) */}
            {plans.filter(plan => plan.id !== 'free_trial').map((plan, index) => {
              const billingText = plan.billingPeriod === 'monthly' ? t('pricingMonthly')
                                : plan.billingPeriod === 'yearly' ? t('pricingYearly')
                                : plan.billingPeriod === 'one_time' ? t('pricingOneTime')
                                : '';
              const planInfo = getLocalizedPlanInfo(plan);
              const isPro = plan.isUnlimited || plan.id === 'pro_unlimited';
              
              return (
                <div 
                  key={plan.id} 
                  id={`landing-plan-${plan.id}`}
                  className={`bg-white rounded-2xl border ${isPro ? 'border-slate-800 shadow-md' : 'border-slate-200/90 shadow-sm'} relative flex flex-col hover:shadow-lg transition-shadow`}
                >
                  {planInfo.badge && (
                    <div className={`absolute top-0 right-4 -translate-y-1/2 ${isPro ? 'bg-slate-900 text-teal-300' : 'bg-slate-700 text-white'} px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm`}>
                      {planInfo.badge}
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{planInfo.name}</h3>
                      <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-3xl font-extrabold tracking-tight">{plan.price} {plan.currency}</span>
                        <span className="text-xs font-medium text-slate-500">{billingText}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 min-h-[36px]">{planInfo.description}</p>
                    </div>

                    <div className="space-y-2.5 mt-4 flex-1">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-slate-800">
                          {plan.isUnlimited ? (
                            <span className="flex items-center gap-1"><InfinityIcon className="w-3.5 h-3.5 text-teal-700" /> {t('pricingUnlimited')}</span>
                          ) : (
                            `${plan.maxAnalyses} ${t('pricingQuota')}`
                          )}
                        </span>
                      </div>
                      {(planInfo.features || []).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <button
                        id={`landing-btn-select-plan-${plan.id}`}
                        onClick={onGetStarted}
                        className={`w-full py-3 px-4 ${isPro ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-700 text-slate-700'} font-semibold text-sm rounded-xl transition-colors shadow-sm`}
                      >
                        {t('pricingRegisterNow')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 8. HIGH-CONVERTING FINAL CTA */}
      <section id="landing-final-cta" className="py-20 bg-slate-900 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_0.75px,transparent_0.75px)] [background-size:20px_20px] opacity-[0.04] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            {t('landingCtaTitle')}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('landingCtaDesc')}
          </p>
          <button 
            id="landing-final-cta-btn"
            onClick={onGetStarted}
            className="px-8 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2 mx-auto group"
          >
            <span>{t('landingCtaBtn')}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 9. REFINED FOOTER */}
      <footer id="landing-footer" className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-900">
            {/* Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center text-white">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-white tracking-wide">HomeoPraxis SaaS</span>
              </div>
              <p className="text-slate-400 text-xs max-w-md leading-relaxed">
                {t('landingFooterBrandDesc')}
              </p>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3 text-[11px]">
                {t('landingFooterNavTitle')}
              </h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={onGetStarted} className="hover:text-teal-400 transition-colors">
                    {t('landingBtnTest')}
                  </button>
                </li>
                <li>
                  <button onClick={onGoToLogin} className="hover:text-teal-400 transition-colors">
                    {t('landingBtnLogin')}
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal & Security */}
            <div>
              <h4 className="font-semibold text-white uppercase tracking-wider mb-3 text-[11px]">
                {t('landingFooterLegalTitle')}
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t('landingFooterPrivacy')}</span>
                </li>
                <li>
                  <span>{t('landingFooterTerms')}</span>
                </li>
                <li>
                  <span>{t('landingFooterSecurity')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <span>{t('landingFooterCopyright')}</span>
            <div className="flex items-center gap-3">
              <span>{t('footerTrialBadge')}</span>
              <span>•</span>
              <span>{t('footerGdprBadge')}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
