const legalContactEmail = 'dev@justmax.xyz';

/** Name, postal address and e-mail of the operator, as required for the imprint and the privacy policy. */
export function LegalContact() {
  return (
    <address className='not-italic'>
      Maximilian Stümpfl
      <br />
      Schubertstr. 15
      <br />
      75045 Walzbachtal
      <br />
      Germany
      <br />
      E-mail: <a href={`mailto:${legalContactEmail}`}>{legalContactEmail}</a>
    </address>
  );
}
