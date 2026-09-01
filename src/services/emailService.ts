import { EmailConfig } from '../types';
import { getEmailConfig } from './storage';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  displayName?: string;
  config?: EmailConfig;
}

export interface EmailTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Holt die Mailbox-Informationen (resourceId & address) von der Hostinger Mail API
 */
export async function getHostingerMailboxInfo(token: string): Promise<{ orderResourceId: string; mailboxResourceId: string; address: string }> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error('Kein Hostinger Mail API Token angegeben.');
  }

  const response = await fetch('https://api.mail.hostinger.com/api/v1/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cleanToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hostinger API Fehler (${response.status}): ${errorText || response.statusText}`);
  }

  const json = await response.json();
  const data = json.data;
  if (!data || !data.mailboxes || data.mailboxes.length === 0) {
    throw new Error('Kein Postfach für diesen Hostinger API-Token gefunden.');
  }

  const primaryMailbox = data.mailboxes[0];
  return {
    orderResourceId: data.orderResourceId,
    mailboxResourceId: primaryMailbox.resourceId,
    address: primaryMailbox.address,
  };
}

/**
 * Sendet eine E-Mail direkt über die Hostinger Mail REST API
 */
export async function sendViaHostingerApi(options: SendEmailOptions): Promise<EmailTestResult> {
  const config = options.config || getEmailConfig();
  const token = (config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf').trim();
  
  if (!token) {
    throw new Error('Hostinger Mail API Token fehlt. Bitte tragen Sie diesen in den E-Mail-Einstellungen ein.');
  }

  let mailboxId = (config.mailboxId || '').trim();
  if (!mailboxId) {
    const info = await getHostingerMailboxInfo(token);
    mailboxId = info.mailboxResourceId;
  }

  const toList = Array.isArray(options.to) ? options.to : [options.to];
  const payload = {
    to: toList,
    displayName: options.displayName || config.fromName || 'HomeoPilot 360',
    subject: options.subject,
    text: options.text || (options.html ? options.html.replace(/<[^>]*>?/gm, '') : ''),
    html: options.html || `<p>${options.text || ''}</p>`,
  };

  const response = await fetch(`https://api.mail.hostinger.com/api/v1/mailboxes/${mailboxId}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 204 || response.status === 200 || response.status === 201) {
    return {
      success: true,
      message: 'E-Mail wurde erfolgreich über die Hostinger Mail API versendet.',
    };
  }

  const errText = await response.text();
  let errMsg = errText;
  try {
    const parsed = JSON.parse(errText);
    if (parsed.message) errMsg = parsed.message;
  } catch {
    // raw text
  }

  throw new Error(`Hostinger API Fehler (${response.status}): ${errMsg || 'Versand fehlgeschlagen'}`);
}

/**
 * Testet die Verbindung oder versendet eine Test-Mail
 */
export async function executeEmailTest(params: {
  config: EmailConfig;
  recipientEmail?: string;
  sendEmail: boolean;
}): Promise<EmailTestResult> {
  const { config, recipientEmail, sendEmail } = params;
  const isApi = config.sendMethod === 'api' || (!config.sendMethod && (config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf'));

  if (isApi) {
    const token = (config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf').trim();
    
    // 1. Mailbox / Token prüfen
    const info = await getHostingerMailboxInfo(token);
    
    if (!sendEmail) {
      return {
        success: true,
        message: `Hostinger Mail API Verbindung erfolgreich! Authentifiziertes Postfach: ${info.address} (Mailbox-ID: ${info.mailboxResourceId})`,
        details: info,
      };
    }

    // 2. Test-E-Mail versenden
    if (!recipientEmail || !recipientEmail.trim()) {
      throw new Error('Bitte geben Sie eine Empfänger-E-Mail-Adresse für den Testversand an.');
    }

    const timestamp = new Date().toLocaleString('de-DE');
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f766e; margin: 0;">HomeoPilot 360</h2>
          <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Praxis- & Fallmanagement System</p>
        </div>
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
          <h3 style="color: #115e59; margin: 0 0 8px 0; font-size: 16px;">E-Mail-Versand erfolgreich eingerichtet!</h3>
          <p style="color: #134e4a; margin: 0; font-size: 14px; line-height: 1.5;">
            Diese Test-Nachricht bestätigt, dass Ihre E-Mail-Konfiguration über die <strong>Hostinger Mail API</strong> voll funktionsfähig ist.
          </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 140px;">Absender:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${config.fromName || 'HomeoPilot 360'} &lt;${info.address}&gt;</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Empfänger:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${recipientEmail.trim()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Versandart:</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Hostinger Mail API (REST / HTTPS)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Zeitpunkt:</td>
            <td style="padding: 8px 0;">${timestamp}</td>
          </tr>
        </table>
        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Automatische Test-Nachricht von HomeoPilot 360</p>
        </div>
      </div>
    `;

    const res = await sendViaHostingerApi({
      to: recipientEmail.trim(),
      subject: `HomeoPilot 360 - E-Mail Testnachricht (${timestamp})`,
      html: htmlBody,
      text: `HomeoPilot 360 - E-Mail Testnachricht\n\nIhre E-Mail-Konfiguration über die Hostinger Mail API funktioniert einwandfrei!\nAbsender: ${info.address}\nEmpfänger: ${recipientEmail.trim()}\nZeitpunkt: ${timestamp}`,
      config,
    });

    return {
      success: true,
      message: `Test-E-Mail wurde erfolgreich an ${recipientEmail.trim()} über die Hostinger Mail API gesendet!`,
      details: res,
    };
  }

  // SMTP über Node.js Backend Server
  try {
    const response = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser,
        smtpPassword: config.smtpPassword,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        toEmail: sendEmail ? (recipientEmail || '').trim() : undefined,
      }),
    });

    let data: any = {};
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = {
        success: false,
        error: response.ok ? 'Unerwartetes Server-Antwortformat.' : `Serverfehler (${response.status})`,
      };
    }

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || (sendEmail ? 'Test-E-Mail erfolgreich versendet.' : 'SMTP-Verbindungstest erfolgreich!'),
      };
    }

    throw new Error(data.error || 'SMTP-Verbindung fehlgeschlagen.');
  } catch (err: any) {
    // Wenn SMTP 404 wirft (z.B. bei statischem Hosting), auf Hostinger API hinweisen oder umschalten
    if (config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf') {
      try {
        const fallbackConfig = { ...config, sendMethod: 'api' as const };
        return await executeEmailTest({ config: fallbackConfig, recipientEmail, sendEmail });
      } catch (fallbackErr: any) {
        throw new Error(`SMTP fehlgeschlagen (${err.message}). API-Fallback Fehler: ${fallbackErr.message}`);
      }
    }
    throw err;
  }
}
