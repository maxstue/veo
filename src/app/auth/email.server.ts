import { Metrics } from '#/shared/lib/observability/metrics';

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

type OrganizationInvitationEmail = {
  invitationUrl: string;
  inviterName: string;
  organizationName: string;
  to: string;
};

export async function sendOrganizationInvitationEmail(apiKey: string, message: OrganizationInvitationEmail) {
  const organizationName = escapeHtml(message.organizationName);
  const inviterName = escapeHtml(message.inviterName);
  const invitationUrl = escapeHtml(message.invitationUrl);

  const response = await fetch('https://api.resend.com/emails', {
    body: JSON.stringify({
      from: 'Veo <support@veo.justmax.xyz>',
      html: `<p>${inviterName} invited you to join ${organizationName} on Veo.</p><p><a href="${invitationUrl}">Accept invitation</a></p><p>This invitation expires in seven days.</p>`,
      subject: `Join ${message.organizationName} on Veo`,
      text: `${message.inviterName} invited you to join ${message.organizationName} on Veo.\n\nAccept the invitation: ${message.invitationUrl}\n\nThis invitation expires in seven days.`,
      to: [message.to],
    }),
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'User-Agent': 'veo/1.0',
    },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the organization invitation email with status ${response.status}.`);
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
