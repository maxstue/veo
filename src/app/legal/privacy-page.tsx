import { type ReactNode } from 'react';

import { lastLoginMethodCookie } from '#/app/auth/last-login-method';

import { LegalContact } from './legal-contact';
import { LegalPage, LegalSection } from './legal-layout';

export function PrivacyPage() {
  return (
    <LegalPage subtitle='Last updated: 27 November 2026' title='Privacy policy'>
      <LegalSection title='Who is responsible'>
        <p>Veo is a free, non-commercial side project. The controller under the GDPR is:</p>
        <LegalContact />
        <p>Contact us at this address for any privacy question or to exercise your rights.</p>
      </LegalSection>

      <LegalSection title='Summary'>
        <p>
          We only process the data needed to run Veo. There is no advertising, no analytics tracking and no profiling.
          Fonts are served from our own domain. We do not sell or share your data with third parties for their own
          purposes.
        </p>
      </LegalSection>

      <LegalSection title='Hosting and server logs'>
        <p>
          Veo runs on Cloudflare Workers (Cloudflare, Inc., USA). Each request is processed by Cloudflare and our
          application logs it with technical data such as IP address, browser information, requested URL and time. We
          use these logs to operate Veo, keep it secure and fix errors. Cloudflare deletes them automatically after its
          retention period of a few days. The legal basis is our legitimate interest in a secure and stable service
          (Art. 6(1)(f) GDPR).
        </p>
      </LegalSection>

      <LegalSection title='Your account'>
        <p>
          To use Veo you create an account. We store your name and e-mail address, and for e-mail sign-up a hashed
          password. If you sign in with Google or Microsoft, we receive your name, e-mail address and profile image from
          that provider. For each sign-in we store a session with your IP address and browser information. A session
          ends when you sign out or after 7 days.
        </p>
        <p>
          We process this data to provide Veo to you (Art. 6(1)(b) GDPR). We keep it until you delete your account. You
          can delete your account at any time on your account page.
        </p>
      </LegalSection>

      <LegalSection title='Sign-in with Google or Microsoft'>
        <p>
          If you choose this option, you are redirected to Google (Google Ireland Ltd.) or Microsoft (Microsoft Ireland
          Operations Ltd.). Their privacy policies apply there. We only receive the data listed above, and only after
          you confirm the sign-in with the provider.
        </p>
      </LegalSection>

      <LegalSection title='Teams and live sessions'>
        <p>
          Within Veo we store the teams you belong to, your role, invitations, bingo terms and game results. During a
          live session we also store your bingo card, marked fields and chat messages. Other team members in the session
          can see your name, card progress and messages. We delete the live data when the session ends, at the latest
          after 24 hours. Team data stays until the team or your account is deleted. The legal basis is Art. 6(1)(b)
          GDPR.
        </p>
      </LegalSection>

      <LegalSection title='E-mails'>
        <p>
          We send password reset e-mails and team invitations through Resend (Resend, Inc., USA). For this we pass on
          the recipient&apos;s e-mail address and the message content. The legal basis is Art. 6(1)(b) GDPR, and for
          invitations our legitimate interest in letting teams invite members (Art. 6(1)(f) GDPR).
        </p>
      </LegalSection>

      <LegalSection title='Error monitoring'>
        <p>
          We use Sentry (Functional Software, Inc., USA) to detect errors and measure performance. The data is stored in
          Sentry&apos;s EU data region in Germany. Error reports contain technical data such as the browser, the page
          and the error itself. We configured Sentry so that it receives no user details, no cookies, no IP-related
          headers and no request contents. We remove query strings and invitation tokens from URLs before sending.
          Performance data is collected for only 5% of requests. The legal basis is our legitimate interest in a working
          service (Art. 6(1)(f) GDPR).
        </p>
      </LegalSection>

      <LegalSection id='cookies' title='Cookies and browser storage'>
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
      </LegalSection>

      <LegalSection title='Transfers outside the EU'>
        <p>
          Cloudflare, Resend and Sentry are based in the USA. Sentry stores our data in the EU, but access from the USA
          cannot be ruled out. Where a provider is certified under the EU-US Data Privacy Framework, the transfer relies
          on the European Commission&apos;s adequacy decision. Otherwise it relies on the EU standard contractual
          clauses (Art. 46(2)(c) GDPR).
        </p>
      </LegalSection>

      <LegalSection title='Your rights'>
        <p>
          You have the right to access, rectification, erasure, restriction of processing, data portability and to
          object to processing based on Art. 6(1)(f) GDPR (Art. 15&ndash;21 GDPR). You also have the right to lodge a
          complaint with a data protection supervisory authority (Art. 77 GDPR).
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function Code({ children }: { children: ReactNode }) {
  return <code className='bg-muted rounded px-1 py-0.5 font-mono text-sm'>{children}</code>;
}
