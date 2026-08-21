import { ChevronRight, Dices } from 'lucide-react';

import { Badge } from '#/shared/ui/badge';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

type TeamTermPreviewItem = { id: string; label: string };

export function TeamTermsPreview({ teamId, terms }: { teamId: string; terms: TeamTermPreviewItem[] }) {
  const missingTerms = Math.max(0, 25 - terms.length);
  const shownTerms = terms.slice(0, 3);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2'>
            <Dices className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
            Bingo terms
          </span>
          <Badge variant={missingTerms ? 'secondary' : 'default'}>{terms.length} / 25</Badge>
        </CardTitle>
        <CardDescription>{getTermRequirementText(missingTerms)}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {shownTerms.length ? (
          <ul className='grid gap-2' aria-label='Bingo term preview'>
            {shownTerms.map((term) => (
              <li className='bg-muted/45 truncate rounded-lg p-3 font-medium' key={term.id}>
                {term.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className='bg-muted/45 text-muted-foreground rounded-lg p-3 text-sm'>
            No terms yet. Add your first meeting classic together.
          </p>
        )}
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/terms' variant='outline'>
          Manage terms
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

function getTermRequirementText(missingTerms: number) {
  if (missingTerms === 0) {
    return 'There are enough terms for a 5×5 card. You can add more at any time.';
  }

  const subject = missingTerms === 1 ? 'term is' : 'terms are';
  return `${missingTerms} more ${subject} needed before you can start a 5×5 card.`;
}
