import { useRouter } from '@tanstack/react-router';
import { Check, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';

import { Badge } from '#/shared/ui/badge';
import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { createBingoTerm, deleteBingoTerm, updateBingoTerm } from './bingo-terms';

export type TeamTerm = { id: string; label: string; updatedAt: Date };

export function TermLibrary({ teamId, terms }: { teamId: string; terms: TeamTerm[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string>();
  const [editingLabel, setEditingLabel] = useState('');
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState<string>();
  const missingTerms = Math.max(0, 25 - terms.length);

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPendingId('new');
    const form = event.currentTarget;
    const value = new FormData(form).get('label');

    try {
      const result = await createBingoTerm({
        data: { teamId, label: typeof value === 'string' ? value : '' },
      });
      if (result.status === 'duplicate') {
        setError('This term already exists in the team.');
        return;
      }
      form.reset();
      await router.invalidate();
    } catch {
      setError('The term is empty, too long, or could not be saved.');
    } finally {
      setPendingId(undefined);
    }
  }

  async function save(termId: string) {
    setError(undefined);
    setPendingId(termId);
    try {
      const result = await updateBingoTerm({ data: { teamId, termId, label: editingLabel } });
      if (result.status === 'duplicate') {
        setError('This term already exists in the team.');
        return;
      }
      if (result.status === 'not-found') {
        setError('This term no longer exists.');
        return;
      }
      setEditingId(undefined);
      await router.invalidate();
    } catch {
      setError('The term is empty, too long, or could not be saved.');
    } finally {
      setPendingId(undefined);
    }
  }

  async function remove(term: TeamTerm) {
    if (!window.confirm(`Delete “${term.label}”?`)) {
      return;
    }
    setError(undefined);
    setPendingId(term.id);
    try {
      const result = await deleteBingoTerm({ data: { teamId, termId: term.id } });
      if (result.status === 'not-found') {
        setError('This term no longer exists.');
      }
      await router.invalidate();
    } catch {
      setError('The term could not be deleted.');
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between gap-3'>
          <span>Bingo terms</span>
          <Badge variant={missingTerms ? 'secondary' : 'default'}>{terms.length} / 25</Badge>
        </CardTitle>
        <CardDescription>{getTermRequirementText(missingTerms)}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='flex flex-col gap-2 sm:flex-row' onSubmit={add}>
          <label className='sr-only' htmlFor='new-term'>
            New bingo term
          </label>
          <input
            className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 min-w-0 flex-1 rounded-lg border px-3 text-base outline-none focus-visible:ring-3'
            disabled={pendingId === 'new'}
            id='new-term'
            maxLength={80}
            name='label'
            placeholder="For example: You're still on mute"
            required
          />
          <Button disabled={pendingId === 'new'} type='submit'>
            {pendingId === 'new' ? (
              <LoaderCircle className='animate-spin' aria-hidden='true' />
            ) : (
              <Plus aria-hidden='true' />
            )}
            Add
          </Button>
        </form>

        {error && (
          <p className='bg-destructive/10 text-destructive mt-3 rounded-lg px-3 py-2 text-sm' role='alert'>
            {error}
          </p>
        )}

        <div className='mt-5 grid gap-2 sm:grid-cols-2'>
          {terms.length ? (
            terms.map((term) => (
              <div className='flex min-w-0 items-center gap-2 rounded-lg border p-2' key={term.id}>
                {editingId === term.id ? (
                  <input
                    aria-label='Edit bingo term'
                    autoFocus
                    className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-8 min-w-0 flex-1 rounded-xl border px-2 outline-none focus-visible:ring-3'
                    maxLength={80}
                    onChange={(event) => setEditingLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        void save(term.id);
                      }
                      if (event.key === 'Escape') {
                        setEditingId(undefined);
                      }
                    }}
                    value={editingLabel}
                  />
                ) : (
                  <span className='min-w-0 flex-1 truncate px-1 font-medium' title={term.label}>
                    {term.label}
                  </span>
                )}
                {editingId === term.id ? (
                  <>
                    <Button
                      aria-label='Save changes'
                      disabled={pendingId === term.id}
                      onClick={() => void save(term.id)}
                      size='icon-sm'
                      type='button'
                      variant='ghost'
                    >
                      {pendingId === term.id ? <LoaderCircle className='animate-spin' /> : <Check />}
                    </Button>
                    <Button
                      aria-label='Cancel editing'
                      onClick={() => setEditingId(undefined)}
                      size='icon-sm'
                      type='button'
                      variant='ghost'
                    >
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      aria-label={`Edit “${term.label}”`}
                      onClick={() => {
                        setEditingId(term.id);
                        setEditingLabel(term.label);
                        setError(undefined);
                      }}
                      size='icon-sm'
                      type='button'
                      variant='ghost'
                    >
                      <Pencil />
                    </Button>
                    <Button
                      aria-label={`Delete “${term.label}”`}
                      disabled={pendingId === term.id}
                      onClick={() => void remove(term)}
                      size='icon-sm'
                      type='button'
                      variant='destructive'
                    >
                      {pendingId === term.id ? <LoaderCircle className='animate-spin' /> : <Trash2 />}
                    </Button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className='text-muted-foreground col-span-full py-5 text-center text-sm'>
              No terms yet. Add your first meeting classic together.
            </p>
          )}
        </div>
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
