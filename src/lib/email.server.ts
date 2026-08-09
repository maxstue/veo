import { Metrics } from './observability/metrics';

type PasswordResetEmail = {
  resetUrl: string;
  to: string;
};

/** Sends a transactional password-reset message without exposing its token to client-side application code. */
export async function sendPasswordResetEmail(apiKey: string, message: PasswordResetEmail) {
  const normalizedApiKey = apiKey.trim();
  const resetUrl = escapeHtml(message.resetUrl);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from: 'Veo <support@veo.justmax.xyz>',
        html: `
        <h1>Reset your Veo password</h1>
        <p>Use the link below to choose a new password. The link expires in one hour.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this change, you can safely ignore this email.</p>
      `.trim(),
        subject: 'Reset your Veo password',
        text: [
          'Reset your Veo password',
          '',
          'Use the link below to choose a new password. The link expires in one hour.',
          message.resetUrl,
          '',
          'If you did not request this change, you can safely ignore this email.',
        ].join('\n'),
        to: [message.to],
      }),
      headers: {
        Authorization: `Bearer ${normalizedApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'veo/1.0',
      },
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Resend rejected the password reset email with status ${response.status}.`);
    }

    Metrics.recordPasswordResetEmailSent();
  } catch (error) {
    Metrics.recordPasswordResetEmailFailed();
    throw error;
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
