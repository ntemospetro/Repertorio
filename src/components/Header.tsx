import React, { useState, useEffect, useRef } from 'react';
import { ActiveView, Therapist } from '../types';
import { isAdminLoggedIn, getSiteConfig } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { 
  ShieldCheck, 
  UserPlus, 
  Stethoscope, 
  Lock,
  Home,
  Menu,
  X,
  ChevronRight,
  Plus,
  Users,
  LayoutDashboard,
  BookOpen,
  User,
  Settings,
  FileText,
  LogOut
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTherapistTab, setActiveTherapistTab] = useState<string>('cases');
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTherapistTab(customEvent.detail);
      }
    };
    window.addEventListener('homoeo_therapist_tab_changed', handleTabChange);
    return () => window.removeEventListener('homoeo_therapist_tab_changed', handleTabChange);
  }, []);

  useEffect(() => {
    const updateLogo = () => setLogoUrl(getSiteConfig().logoUrl || '');
    updateLogo();
    window.addEventListener('homoeo_site_config_changed', updateLogo);
    return () => window.removeEventListener('homoeo_site_config_changed', updateLogo);
  }, []);

  // Close mobile menu whenever view changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentView]);

  // Click outside and ESC listener to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleAdminClick = () => {
    onViewChange('admin');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => onViewChange(activeTherapist ? 'therapist' : 'landing')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
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
                <span className="font-bold text-lg sm:text-xl text-teal-900 tracking-tight">
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 sm:gap-3">
            {currentView === 'therapist' ? (
              <div className="flex items-center gap-2">
                {/* 1. Neuer Patient */}
                <button
                  type="button"
                  id="header-btn-new-patient"
                  onClick={() => window.dispatchEvent(new CustomEvent('homoeo_action_new_patient'))}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('btnNewPatientAdmission')}</span>
                </button>

                {/* 2. Zur Kartei */}
                <button
                  type="button"
                  id="header-btn-to-files"
                  onClick={() => window.dispatchEvent(new CustomEvent('homoeo_action_open_patient_directory'))}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>{t('btnExistingPatientToFiles')}</span>
                </button>
              </div>
            ) : (
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
                  className="px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-white/60"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{t('navTherapist')}</span>
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
                  <span>{t('navAdmin')}</span>
                  {isAdmin && (
                    <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded-full">
                      {t('navActive')}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Language Switcher Dropdown */}
            <LanguageSelector variant="dropdown" />

            <div className="w-px h-6 bg-slate-200 mx-0.5 hidden lg:block"></div>
            <span id="user-badge" className="text-xs font-medium text-slate-500 hidden lg:inline-block max-w-[140px] truncate">
              {activeTherapist ? `${activeTherapist.vorname} ${activeTherapist.nachname}` : t('navPreview')}
            </span>
          </nav>

          {/* Mobile & Tablet Action Bar (Language + Responsive Hamburger Toggle) */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            <LanguageSelector variant="dropdown" />

            <button
              type="button"
              id="header-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              aria-label={mobileMenuOpen ? t('navMenuClose') : t('navMenu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div
          id="header-mobile-dropdown"
          ref={mobileMenuRef}
          className="md:hidden border-t border-slate-200/90 bg-white/98 backdrop-blur-md px-4 py-3 shadow-xl space-y-1 animate-in slide-in-from-top-2 duration-150 max-h-[calc(100vh-4.5rem)] overflow-y-auto"
        >
          {currentView === 'therapist' ? (
            <>
              {/* 1. Neuer Kunde & Zur Kartei */}
              <div className="grid grid-cols-2 gap-2 pb-2.5 mb-2 border-b border-slate-100">
                <button
                  type="button"
                  id="mobile-header-btn-new-patient"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('homoeo_action_new_patient'));
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('btnNewPatientAdmission')}</span>
                </button>
                <button
                  type="button"
                  id="mobile-header-btn-to-files"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('homoeo_action_open_patient_directory'));
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>{t('btnExistingPatientToFiles')}</span>
                </button>
              </div>

              {/* 2. Name des Therapeuten wie es derzeit steht */}
              {activeTherapist && (
                <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {activeTherapist.vorname[0]}{activeTherapist.nachname[0]}
                  </div>
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {activeTherapist.vorname} {activeTherapist.nachname}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {activeTherapist.email}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md shrink-0 border border-teal-200/60">
                    {activeTherapist.tarif === 'free_trial' ? 'Testphase' : 'Aktiv'}
                  </span>
                </div>
              )}

              {/* 3. Startseite */}
              <button
                type="button"
                id="mobile-nav-home"
                onClick={() => {
                  onViewChange('landing');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>{t('navHome')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* 4. Und danach alles was normalerweise links steht wie im Bild */}
              <div className="space-y-1 pt-1 border-t border-slate-100 mt-1">
                {/* Falldokumentation & Repertorisation */}
                <button
                  type="button"
                  id="mobile-nav-tab-cases"
                  onClick={() => {
                    setActiveTherapistTab('cases');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'cases' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'cases'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    <span>{t('tabCaseManagement')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Patienten- & Kundenkartei */}
                <button
                  type="button"
                  id="mobile-nav-tab-patients"
                  onClick={() => {
                    setActiveTherapistTab('patients');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'patients' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'patients'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-teal-600" />
                    <span>{t('tabPatientDirectory')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Materia Medica & Akutaufnahme */}
                <button
                  type="button"
                  id="mobile-nav-tab-materiamedica"
                  onClick={() => {
                    setActiveTherapistTab('materiamedica');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'materiamedica' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'materiamedica'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <span>{t('tabMateriaMedica')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Subtle Divider */}
                <div className="my-1.5 border-t border-slate-100" />

                {/* Profil */}
                <button
                  type="button"
                  id="mobile-nav-tab-profile"
                  onClick={() => {
                    setActiveTherapistTab('profile');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'profile' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'profile'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>{t('navProfile')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Einstellungen */}
                <button
                  type="button"
                  id="mobile-nav-tab-tariff"
                  onClick={() => {
                    setActiveTherapistTab('tariff');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'tariff' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'tariff'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>{t('navSettings')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Bedienungsanleitung & Doku */}
                <button
                  type="button"
                  id="mobile-nav-tab-documentation"
                  onClick={() => {
                    setActiveTherapistTab('documentation');
                    window.dispatchEvent(new CustomEvent('homoeo_action_set_therapist_tab', { detail: 'documentation' }));
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    activeTherapistTab === 'documentation'
                      ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/70'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>{t('tabDocumentation')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Abmelden */}
                <button
                  type="button"
                  id="mobile-nav-therapist-logout"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('homoeo_action_therapist_logout'));
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>{t('navLogout')}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-300" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Startseite */}
              <button
                type="button"
                id="mobile-nav-home"
                onClick={() => {
                  onViewChange('landing');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  currentView === 'landing'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200/70'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>{t('navHome')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Registrierung */}
              <button
                type="button"
                id="mobile-nav-register"
                onClick={() => {
                  onViewChange('register');
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  currentView === 'register'
                    ? 'bg-teal-50 text-teal-900 border border-teal-200/70'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>{t('navRegister')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Therapeuten-Panel */}
              <button
                type="button"
                id="mobile-nav-therapist"
                onClick={() => {
                  onViewChange('therapist');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  <span>{t('navTherapist')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {activeTherapist && (
                    <span className={`w-2 h-2 rounded-full ${
                      activeTherapist.usedAnalyses >= activeTherapist.maxAnalyses && activeTherapist.tarif === 'free_trial'
                        ? 'bg-rose-500'
                        : 'bg-teal-500'
                    }`} />
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Admin-Panel */}
              <button
                type="button"
                id="mobile-nav-admin"
                onClick={() => {
                  handleAdminClick();
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{t('navAdmin')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                      {t('navActive')}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>

              {/* Active Therapist Account Banner in Mobile Dropdown */}
              {activeTherapist && (
                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between px-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {activeTherapist.vorname[0]}{activeTherapist.nachname[0]}
                    </div>
                    <div className="truncate">
                      <span className="font-semibold text-slate-800 block truncate">
                        {activeTherapist.vorname} {activeTherapist.nachname}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {activeTherapist.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md shrink-0 border border-teal-100">
                    {activeTherapist.tarif === 'free_trial' ? 'Testphase' : 'Aktiv'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
};
