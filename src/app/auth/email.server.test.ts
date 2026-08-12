import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const metrics = vi.hoisted(() => ({
  recordPasswordResetEmailFailed: vi.fn(),
  recordPasswordResetEmailSent: vi.fn(),
}));

vi.mock('#/shared/lib/observability/metrics', () => ({ Metrics: metrics }));

import { sendPasswordResetEmail } from './email.server';

describe('sendPasswordResetEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends text and escaped HTML variants through the Resend API', async () => {
    const apiKey = ['test', 'api', 'key'].join('-');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'message-1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await sendPasswordResetEmail(apiKey, {
      resetUrl: 'https://veo.example/reset-password?token=a&next="unsafe"',
      to: 'user@example.test',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${apiKey}`, 'User-Agent': 'veo/1.0' }),
        method: 'POST',
      }),
    );
    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    const body = JSON.parse(request.body as string) as { from: string; html: string; text: string; to: string[] };
    expect(body).toEqual(
      expect.objectContaining({
        from: 'Veo <support@veo.justmax.xyz>',
        text: expect.stringContaining('https://veo.example/reset-password?token=a&next="unsafe"'),
        to: ['user@example.test'],
      }),
    );
    expect(body.html).toContain('token=a&amp;next=&quot;unsafe&quot;');
    expect(metrics.recordPasswordResetEmailSent).toHaveBeenCalledOnce();
    expect(metrics.recordPasswordResetEmailFailed).not.toHaveBeenCalled();
  });

  it('rejects unsuccessful Resend responses without including provider response data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('provider details', { status: 403 })));

    await expect(
      sendPasswordResetEmail(['test', 'api', 'key'].join('-'), {
        resetUrl: 'https://veo.example/reset-password?token=token',
        to: 'user@example.test',
      }),
    ).rejects.toThrow('Resend rejected the password reset email with status 403.');
    expect(metrics.recordPasswordResetEmailFailed).toHaveBeenCalledOnce();
    expect(metrics.recordPasswordResetEmailSent).not.toHaveBeenCalled();
  });
});
