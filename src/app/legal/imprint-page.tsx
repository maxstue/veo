import { LegalContact } from './legal-contact';
import { LegalPage, LegalSection } from './legal-layout';

export function ImprintPage() {
  return (
    <LegalPage subtitle='Impressum – information according to § 5 DDG' title='Imprint'>
      <LegalSection title='Operator'>
        <LegalContact />
      </LegalSection>
    </LegalPage>
  );
}
