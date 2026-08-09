import { useRouter } from '@tanstack/react-router';
import { BookmarkPlus, ChevronRight, LoaderCircle, Settings2, Star } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { supportedBingoBoardSizes, type BingoRules } from '#/lib/bingo-game';
import { saveTeamBingoRulesPreset, setTeamDefaultBingoRulesPreset } from '#/lib/teams';

type BingoRulesConfig = Omit<BingoRules, 'boardSize'> & { boardSize: number };
type BingoRulesPreset = BingoRulesConfig & { id: string; name: string };

export function TeamBingoRulesPreview({
  teamId,
  rules,
  presets,
}: {
  teamId: string;
  rules: BingoRulesConfig;
  presets: BingoRulesPreset[];
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
        <p className='text-muted-foreground text-sm'>
          {presets.length
            ? `${presets.length} saved ${presets.length === 1 ? 'template' : 'templates'} available.`
            : 'Configure card sizes, winning patterns, and reusable templates.'}
        </p>
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/bingo-rules' variant='outline'>
          Manage bingo rules
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

export function BingoRulesLibrary({
  teamId,
  rules,
  presets,
  defaultPresetId,
}: {
  teamId: string;
  rules: BingoRulesConfig;
  presets: BingoRulesPreset[];
  defaultPresetId: string | null;
}) {
  const router = useRouter();
  const [boardSize, setBoardSize] = useState(rules.boardSize);
  const [horizontal, setHorizontal] = useState(rules.horizontal);
  const [vertical, setVertical] = useState(rules.vertical);
  const [diagonal, setDiagonal] = useState(rules.diagonal);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [presetName, setPresetName] = useState('');
  const selectedPatternCount = Number(horizontal) + Number(vertical) + Number(diagonal);
  const termCount = boardSize * boardSize;

  async function savePreset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPatternCount) {
      setError('Select at least one winning pattern.');
      return;
    }

    setError(undefined);
    setPending(true);
    try {
      await saveTeamBingoRulesPreset({
        data: { teamId, name: presetName, boardSize, horizontal, vertical, diagonal },
      });
      setPresetName('');
      await router.invalidate();
    } catch {
      setError('The rule template could not be saved.');
    } finally {
      setPending(false);
    }
  }

  async function setDefaultPreset(presetId: string) {
    setError(undefined);
    setPending(true);
    try {
      const result = await setTeamDefaultBingoRulesPreset({ data: { teamId, presetId } });
      if (result.status === 'not-found') {
        setError('This rule template no longer exists.');
        return;
      }
      await router.invalidate();
    } catch {
      setError('The default template could not be saved.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between gap-3'>
          <span className='flex items-center gap-2'>
            <Settings2 className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
            Bingo rules
          </span>
          <Badge variant='secondary'>
            {boardSize} × {boardSize}
          </Badge>
        </CardTitle>
        <CardDescription>Changes apply to newly shuffled cards. Existing cards keep their rules.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <label className='grid gap-1.5 text-sm font-medium'>
          Card size
          <select
            className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 rounded-lg border px-3 font-normal outline-none focus-visible:ring-3'
            disabled={pending}
            onChange={(event) => setBoardSize(Number(event.target.value) as BingoRules['boardSize'])}
            value={boardSize}
          >
            {supportedBingoBoardSizes.map((size) => (
              <option key={size} value={size}>
                {size} × {size} ({size * size} terms)
              </option>
            ))}
          </select>
        </label>

        <fieldset className='grid gap-2'>
          <legend className='text-sm font-medium'>Winning patterns</legend>
          <RuleCheckbox checked={horizontal} label='Horizontal rows' onChange={setHorizontal} />
          <RuleCheckbox checked={vertical} label='Vertical columns' onChange={setVertical} />
          <RuleCheckbox checked={diagonal} label='Diagonals' onChange={setDiagonal} />
        </fieldset>

        {error && (
          <p className='text-destructive text-sm' role='alert'>
            {error}
          </p>
        )}
        <p className='text-muted-foreground text-xs'>
          New {boardSize}×{boardSize} cards need {termCount} team terms.
        </p>
        <form className='mt-auto flex gap-2' onSubmit={(event) => void savePreset(event)}>
          <label className='sr-only' htmlFor='bingo-rules-preset-name'>
            Rule template name
          </label>
          <input
            className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-3'
            disabled={pending}
            id='bingo-rules-preset-name'
            maxLength={50}
            onChange={(event) => setPresetName(event.target.value)}
            placeholder='Save as template…'
            required
            value={presetName}
          />
          <Button className='h-10' disabled={pending} type='submit'>
            {pending ? (
              <LoaderCircle className='animate-spin' aria-hidden='true' />
            ) : (
              <BookmarkPlus aria-hidden='true' />
            )}
            Save template
          </Button>
        </form>
        {presets.length > 0 && (
          <div className='grid gap-2'>
            <p className='text-sm font-medium'>Saved templates</p>
            {presets.map((preset) => (
              <div className='flex items-center justify-between gap-2 rounded-lg border px-3 py-2' key={preset.id}>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{preset.name}</p>
                  <p className='text-muted-foreground text-xs'>{getRulesSummary(preset)}</p>
                </div>
                <div className='flex shrink-0'>
                  <Button
                    aria-label={
                      preset.id === defaultPresetId
                        ? `“${preset.name}” is the default template`
                        : `Make “${preset.name}” the default template`
                    }
                    disabled={pending || preset.id === defaultPresetId}
                    className={
                      preset.id === defaultPresetId
                        ? 'bg-primary/15 text-primary cursor-default disabled:opacity-100 dark:bg-violet-300/20 dark:text-violet-200'
                        : 'hover:bg-primary/10 hover:text-primary dark:hover:bg-violet-300/15 dark:hover:text-violet-200'
                    }
                    onClick={() => void setDefaultPreset(preset.id)}
                    size='icon-sm'
                    title={preset.id === defaultPresetId ? 'Default template' : 'Make default'}
                    type='button'
                    variant='ghost'
                  >
                    <Star
                      className={
                        preset.id === defaultPresetId
                          ? 'fill-primary text-primary dark:fill-violet-300 dark:text-violet-200'
                          : undefined
                      }
                    />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getRulesSummary(rules: BingoRulesConfig) {
  const patterns = [rules.horizontal && 'rows', rules.vertical && 'columns', rules.diagonal && 'diagonals']
    .filter(Boolean)
    .join(', ');
  return `${rules.boardSize}×${rules.boardSize} · ${patterns}`;
}

function RuleCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className='flex items-center gap-2 rounded-lg border px-3 py-2 text-sm'>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type='checkbox' />
      {label}
    </label>
  );
}
