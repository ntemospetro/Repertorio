import React, { useState, useEffect } from 'react';
import { ActiveView, Therapist } from '../types';
import { isAdminLoggedIn, getSiteConfig } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { 
  ShieldCheck, 
  UserPlus, 
  Stethoscope, 
  Lock,
  Home
} from 'lucide-react';

interface HeaderProps {
  currentView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  activeTherapist: Therapist | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  activeTherapist,
}) => {
  const isAdmin = isAdminLoggedIn();
  const { t } = useTranslation();
  const [logoUrl, setLogoUrl] = useState(() => getSiteConfig().logoUrl || '');

  useEffect(() => {
    const updateLogo = () => setLogoUrl(getSiteConfig().logoUrl || '');
    updateLogo();
    window.addEventListener('homoeo_site_config_changed', updateLogo);
    return () => window.removeEventListener('homoeo_site_config_changed', updateLogo);
  }, []);

  const handleAdminClick = () => {
    onViewChange('admin');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => onViewChange(activeTherapist ? 'therapist' : 'landing')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-lg shadow-xs" />
            ) : (
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
                <span className="text-white font-bold text-lg leading-none">H</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl text-teal-900 tracking-tight">
                  {t('brandName')}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase tracking-wider">
                  SaaS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block -mt-0.5">
                {t('brandTagline')}
              </p>
            </div>
          </div>

          {/* Navigation Links & Language Switcher */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200 text-xs font-semibold">
              {/* 1. Registrierung */}
              <button
                id="header-nav-register"
                onClick={() => onViewChange('register')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'register'
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('navRegister')}</span>
              </button>

              {/* 2. Therapeuten-Panel */}
              <button
                id="header-nav-therapist"
                onClick={() => onViewChange('therapist')}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'therapist'
                    ? 'bg-white text-teal-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('navTherapist')}</span>
                <span className="md:hidden">Panel</span>
                {activeTherapist && (
                  <span className={`w-2 h-2 rounded-full ${
                    activeTherapist.usedAnalyses >= activeTherapist.maxAnalyses && activeTherapist.tarif === 'free_trial'
                      ? 'bg-rose-500'
                      : 'bg-teal-500'
                  }`} />
                )}
              </button>

              {/* 3. Admin-Panel */}
              <button
                id="header-nav-admin"
                onClick={handleAdminClick}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden md:inline">{t('navAdmin')}</span>
                <span className="md:hidden">Admin</span>
                {isAdmin && (
                  <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded-full">
                    {t('navActive')}
                  </span>
                )}
              </button>
            </div>

            {/* Language Switcher Dropdown (Frontseite & All Views) */}
            <LanguageSelector variant="dropdown" />

            <div className="w-px h-6 bg-slate-200 mx-0.5 hidden lg:block"></div>
            <span id="user-badge" className="text-xs font-medium text-slate-500 hidden lg:inline-block max-w-[140px] truncate">
              {activeTherapist ? `${activeTherapist.vorname} ${activeTherapist.nachname}` : t('navPreview')}
            </span>
          </nav>
        </div>
      </div>
    </header>
  );
};
