import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, X, Copy, KeyRound } from 'lucide-react';
import { getAdminCredentials } from '../services/storage';
import { useTranslation } from '../i18n/LanguageContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAutoFillCredentials?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onAutoFillCredentials,
}) => {
  const { t } = useTranslation();
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const adminCreds = getAdminCredentials();

  if (!isOpen) return null;

  const handleSendReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 600);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(adminCreds.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800 text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
            <KeyRound className="w-5 h-5 text-teal-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t('forgotPwTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('forgotPwSubtitle')}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isSent ? (
            <form onSubmit={handleSendReset} className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                {t('forgotPwInstructions')}
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>{t('forgotPwDestination')}</span>
                  <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                    Yahoo Mail Server
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span>{adminCreds.resetEmailDestination}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="btn-confirm-send-reset-email"
                  type="submit"
                  disabled={isSending}
                  className="w-full py-2.5 px-4 rounded-md bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {isSending ? (
                    <span>{t('forgotPwSending')}</span>
                  ) : (
                    <>
                      <span>{t('forgotPwSendBtn')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-teal-900">
                    {t('forgotPwSuccessTitle')}
                  </h4>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    {t('forgotPwSuccessSubtitle', { email: adminCreds.resetEmailDestination })}
                  </p>
                </div>
              </div>

              {/* Simulated Mail Inbox Preview */}
              <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-semibold">📩 Posteingang: {adminCreds.resetEmailDestination}</span>
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="p-4 bg-white space-y-2 text-xs">
                  <div className="text-slate-500 text-[11px]">
                    <strong>Betreff:</strong> Passwort-Wiederherstellung für Homeopilot360 Admin
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    <strong>Absender:</strong> security@homeopilot360.internal
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1 mt-2">
                    <p>Hallo Administrator,</p>
                    <p>Ihre hinterlegten Zugangsdaten lauten:</p>
                    <p className="text-teal-900 font-bold bg-white p-1.5 rounded border border-slate-200">
                      E-Mail: {adminCreds.email}<br />
                      Passwort: {adminCreds.password}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleCopyPassword}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? t('forgotPwCopied') : t('forgotPwCopyPw')}</span>
                </button>

                {onAutoFillCredentials && (
                  <button
                    onClick={() => {
                      onAutoFillCredentials();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>{t('forgotPwApplyToLogin')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
