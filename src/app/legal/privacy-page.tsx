import { type ReactNode } from 'react';

import { lastLoginMethodCookie } from '#/app/auth/last-login-method';
import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';

// TODO(QUEST-63): Replace with the controller's legal name and contact address before merging.
const controller = { name: '[Name of the controller]', email: '[contact e-mail address]' };
const lastUpdated = '27 November 2026';

export function PrivacyPage() {
  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <article className='mx-auto max-w-3xl py-12 sm:py-16'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>Privacy policy</h1>
        <p className='text-muted-foreground mt-3'>Last updated: {lastUpdated}</p>

        <Section title='Who is responsible'>
          <p>
            Veo is a free, non-commercial side project. The controller under the GDPR is {controller.name}. You can
            reach us at <a href={`mailto:${controller.email}`}>{controller.email}</a> for any privacy question or to
            exercise your rights.
          </p>
        </Section>

        <Section title='Summary'>
          <p>
            We only process the data needed to run Veo. There is no advertising, no analytics tracking and no profiling.
            Fonts are served from our own domain. We do not sell or share your data with third parties for their own
            purposes.
          </p>
        </Section>

        <Section title='Hosting and server logs'>
          <p>
            Veo runs on Cloudflare Workers (Cloudflare, Inc., USA). Each request is processed by Cloudflare and our
            application logs it with technical data such as IP address, browser information, requested URL and time. We
            use these logs to operate Veo, keep it secure and fix errors. Cloudflare deletes them automatically after
            its retention period of a few days. The legal basis is our legitimate interest in a secure and stable
            service (Art. 6(1)(f) GDPR).
          </p>
        </Section>

        <Section title='Your account'>
          <p>
            To use Veo you create an account. We store your name and e-mail address, and for e-mail sign-up a hashed
            password. If you sign in with Google or Microsoft, we receive your name, e-mail address and profile image
            from that provider. For each sign-in we store a session with your IP address and browser information. A
            session ends when you sign out or after 7 days.
          </p>
          <p>
            We process this data to provide Veo to you (Art. 6(1)(b) GDPR). We keep it until you delete your account.
            You can delete your account at any time on your account page.
          </p>
        </Section>

        <Section title='Sign-in with Google or Microsoft'>
          <p>
            If you choose this option, you are redirected to Google (Google Ireland Ltd.) or Microsoft (Microsoft
            Ireland Operations Ltd.). Their privacy policies apply there. We only receive the data listed above, and
            only after you confirm the sign-in with the provider.
          </p>
        </Section>

        <Section title='Teams and live sessions'>
          <p>
            Within Veo we store the teams you belong to, your role, invitations, bingo terms and game results. During a
            live session we also store your bingo card, marked fields and chat messages. Other team members in the
            session can see your name, card progress and messages. We delete the live data when the session ends, at the
            latest after 24 hours. Team data stays until the team or your account is deleted. The legal basis is Art.
            6(1)(b) GDPR.
          </p>
        </Section>

        <Section title='E-mails'>
          <p>
            We send password reset e-mails and team invitations through Resend (Resend, Inc., USA). For this we pass on
            the recipient&apos;s e-mail address and the message content. The legal basis is Art. 6(1)(b) GDPR, and for
            invitations our legitimate interest in letting teams invite members (Art. 6(1)(f) GDPR).
          </p>
        </Section>

        <Section title='Error monitoring'>
          <p>
            We use Sentry (Functional Software, Inc., USA) to detect errors and measure performance. Error reports
            contain technical data such as the browser, the page and the error itself. We configured Sentry so that it
            receives no user details, no cookies, no IP-related headers and no request contents. We remove query strings
            and invitation tokens from URLs before sending. Performance data is collected for only 5% of requests. The
            legal basis is our legitimate interest in a working service (Art. 6(1)(f) GDPR).
          </p>
        </Section>

        <Section id='cookies' title='Cookies and browser storage'>
          <p>We only store information in your browser where it is needed for a function you use:</p>
          <ul className='mt-3 list-disc space-y-3 pl-5'>
            <li>
              <Code>better-auth.session_token</Code> and <Code>better-auth.session_data</Code> keep you signed in. On
              HTTPS they carry the prefix <Code>__Secure-</Code>. They last for the session duration of up to 7 days.
              Short-lived cookies also protect the Google and Microsoft sign-in against forged requests.
            </li>
            <li>
              <Code>{lastLoginMethodCookie.name}</Code> is only set if you tick &ldquo;Remember sign-in method on this
              browser for 30 days&rdquo; on the sign-in page. It then stores whether you last signed in with e-mail,
              Google or Microsoft, so we can mark that option as &ldquo;Last used&rdquo;. It contains no account ID or
              e-mail address and is not stored on our servers. It expires after 30 days, and each sign-in renews it.
              Untick the box to delete it immediately.
            </li>
            <li>
              <Code>veo-theme</Code> in local storage remembers the colour theme you selected. It is stored until you
              change the theme or clear your browser data.
            </li>
          </ul>
          <p>
            These entries are strictly necessary for a service you explicitly requested, so no consent is needed under §
            25(2) No. 2 TDDDG. You can delete them at any time in your browser settings.
          </p>
        </Section>

        <Section title='Transfers outside the EU'>
          <p>
            Cloudflare, Resend and Sentry are based in the USA. Where a provider is certified under the EU-US Data
            Privacy Framework, the transfer relies on the European Commission&apos;s adequacy decision. Otherwise it
            relies on the EU standard contractual clauses (Art. 46(2)(c) GDPR).
          </p>
        </Section>

        <Section title='Your rights'>
          <p>
            You have the right to access, rectification, erasure, restriction of processing, data portability and to
            object to processing based on Art. 6(1)(f) GDPR (Art. 15&ndash;21 GDPR). You also have the right to lodge a
            complaint with a data protection supervisory authority (Art. 77 GDPR).
          </p>
        </Section>
      </article>
    </PageShell>
  );
}

function Section({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section
      className='[&_a]:text-primary mt-10 scroll-mt-6 space-y-3 leading-relaxed [&_a]:underline [&_a]:underline-offset-4'
      id={id}
    >
      <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>
      {children}
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className='bg-muted rounded px-1 py-0.5 font-mono text-sm'>{children}</code>;
}
