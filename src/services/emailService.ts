import { EmailConfig } from '../types';
import { getEmailConfig, getTherapists, getAdminCredentials } from './storage';

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
 * Sendet eine Passwort-Wiederherstellungs-E-Mail auf Englisch
 */
export async function sendPasswordRecoveryEmail(targetEmail: string): Promise<boolean> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  if (!cleanEmail) return false;

  const therapists = getTherapists();
  const foundTherapist = therapists.find(t => t.email.trim().toLowerCase() === cleanEmail);
  const adminCreds = getAdminCredentials();
  const isAdminMatch = adminCreds.email.trim().toLowerCase() === cleanEmail || 
                       (adminCreds.resetEmailDestination && adminCreds.resetEmailDestination.trim().toLowerCase() === cleanEmail);

  if (!foundTherapist && !isAdminMatch) {
    // E-Mail nicht im System vorhanden -> Laut Anforderung wird nichts angezeigt und einfach ignoriert
    return false;
  }

  const recipientName = foundTherapist 
    ? `${foundTherapist.vorname || ''} ${foundTherapist.nachname || ''}`.trim() || 'Therapist' 
    : 'Administrator';
  const accountRole = foundTherapist ? 'Registered Therapist Account' : 'System Administrator';
  const retrievedPassword = foundTherapist ? (foundTherapist.password || 'homoeo2025!') : adminCreds.password;
  const loginEmail = foundTherapist ? foundTherapist.email : adminCreds.email;

  const emailSubject = `HomeoPilot 360 - Account Password Recovery`;
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Recovery</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.06);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="font-size: 32px; line-height: 1; margin-bottom: 10px;">🔐</div>
      <h1 style="font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px; color: #ffffff;">HomeoPilot 360</h1>
      <p style="font-size: 13px; color: #99f6e4; margin: 6px 0 0 0; font-weight: 500;">Account Credentials & Password Recovery</p>
    </div>

    <!-- Content Body -->
    <div style="padding: 32px 28px;">
      <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Hello ${recipientName},</h2>
      
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
        We received a request to retrieve your login credentials for your <strong>HomeoPilot 360</strong> account. Below you will find your registered access details:
      </p>

      <!-- Credentials Box -->
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-left: 4px solid #0d9488; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f766e; margin-bottom: 14px;">
          Registered Account Credentials
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 130px;">Account Type:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${accountRole}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Login Email:</td>
            <td style="padding: 6px 0; color: #0d9488; font-family: monospace; font-weight: 700; text-align: right;">${loginEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0 0 0; color: #64748b; font-weight: 600;">Password:</td>
            <td style="padding: 8px 0 0 0; text-align: right;">
              <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #042f2e; background: #ffffff; padding: 5px 12px; border-radius: 6px; border: 1px solid #99f6e4; display: inline-block;">${retrievedPassword}</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Security Notice -->
      <div style="font-size: 12px; color: #64748b; line-height: 1.5; background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
        <strong style="color: #334155;">Security Notice:</strong> Please keep your password safe. If you did not request this recovery email, please log into your account and change your password or notify our support team immediately.
      </div>

      <!-- Button -->
      <div style="text-align: center; margin: 28px 0 10px 0;">
        <a href="https://homeopilot360.com" style="display: inline-block; background-color: #0d9488; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 13px; letter-spacing: 0.2px;">
          Log In to HomeoPilot 360 &rarr;
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">HomeoPilot 360 • Clinical Homeopathy & Practice Management</p>
      <p style="margin: 0;">This is an automated security notice. Please do not reply directly to this email.</p>
    </div>

  </div>
</body>
</html>
  `;

  const textBody = `HomeoPilot 360 - Account Password Recovery\n\nHello ${recipientName},\n\nYour registered account credentials:\nAccount Type: ${accountRole}\nLogin Email: ${loginEmail}\nPassword: ${retrievedPassword}\n\nPlease keep your credentials secure.\n\nHomeoPilot 360 Team`;

  try {
    const config = getEmailConfig();
    const isApi = config.sendMethod === 'api' || (!config.sendMethod && (config.apiToken || 'ca5694e04833ec07a5a65dbe06af56952c3e1fb04cc66e546b50fc5c84464aaf'));

    if (isApi) {
      await sendViaHostingerApi({
        to: cleanEmail,
        subject: emailSubject,
        html: htmlBody,
        text: textBody,
        displayName: config.fromName || 'HomeoPilot 360 Security',
        config,
      });
      return true;
    } else {
      // SMTP fallback
      await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpSecure: config.smtpSecure,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          fromEmail: config.fromEmail,
          fromName: config.fromName || 'HomeoPilot 360 Security',
          toEmail: cleanEmail,
          subject: emailSubject,
          html: htmlBody,
          text: textBody,
        }),
      });
      return true;
    }
  } catch (err) {
    // API Fallback try
    try {
      const fallbackConfig = { ...getEmailConfig(), sendMethod: 'api' as const };
      await sendViaHostingerApi({
        to: cleanEmail,
        subject: emailSubject,
        html: htmlBody,
        text: textBody,
        displayName: fallbackConfig.fromName || 'HomeoPilot 360 Security',
        config: fallbackConfig,
      });
      return true;
    } catch {
      return false;
    }
  }
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

