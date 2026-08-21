import { ChevronRight, Settings2 } from 'lucide-react';

import { type BingoRules } from '#/shared/lib/bingo-rules';
import { Badge } from '#/shared/ui/badge';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

type BingoRulesPreviewConfig = Omit<BingoRules, 'boardSize'> & { boardSize: number };

export function TeamBingoRulesPreview({
  teamId,
  rules,
  presets,
}: {
  teamId: string;
  rules: BingoRulesPreviewConfig;
  presets: unknown[];
}) {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2'>
            <Settings2 className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
            Bingo rules
          </span>
          <Badge variant='secondary'>
            {rules.boardSize} × {rules.boardSize}
          </Badge>
        </CardTitle>
        <CardDescription>{getRulesSummary(rules)}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <p className='text-muted-foreground text-sm'>{getPresetSummary(presets.length)}</p>
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/bingo-rules' variant='outline'>
          Manage bingo rules
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

function getRulesSummary(rules: BingoRulesPreviewConfig) {
  const patterns = [rules.horizontal && 'rows', rules.vertical && 'columns', rules.diagonal && 'diagonals']
    .filter(Boolean)
    .join(', ');
  return `${rules.boardSize}×${rules.boardSize} · ${patterns}`;
}

function getPresetSummary(presetCount: number) {
  if (!presetCount) {
    return 'Configure card sizes, winning patterns, and reusable templates.';
  }
  const templateLabel = presetCount === 1 ? 'template' : 'templates';
  return `${presetCount} saved ${templateLabel} available.`;
}
