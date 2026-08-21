import { createFileRoute, redirect } from '@tanstack/react-router';

import { BingoConfetti } from '#/app/game-session/bingo/bingo-card';
import { getBingoGame } from '#/app/game-session/bingo/bingo-cards';
import {
  BingoGameBackLink,
  BingoGameBoard,
  BingoGameEmptyState,
  BingoGameError,
  BingoGameLayout,
  BingoGameToolbar,
} from '#/app/game-session/bingo/sections';
import { useBingoGame } from '#/app/game-session/bingo/use-bingo-game';
import { getTeam } from '#/app/teams/api';

export const Route = createFileRoute('/teams/$teamId/play')({
  beforeLoad: ({ context, params }) => {
    if (!context.session) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/play` } });
    }
  },
  loader: async ({ params }) => {
    const [teamData, game] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getBingoGame({ data: { teamId: params.teamId } }),
    ]);
    return { game, teamData };
  },
  component: BingoRoute,
});

function BingoRoute() {
  const { game, teamData } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const state = useBingoGame({ game, teamData, teamId });
  return (
    <BingoGameLayout>
      <BingoGameBackLink teamId={teamId} />
      {state.celebration > 0 && <BingoConfetti key={state.celebration} />}
      <section className='grid min-h-0 grid-rows-[auto_minmax(0,1fr)] justify-items-center gap-3'>
        <BingoGameToolbar
          boardSize={state.boardSize}
          card={state.card}
          disabled={state.isTogglingCell}
          onCreate={state.createCard}
          onPresetChange={state.selectPreset}
          onReset={state.resetCard}
          pending={state.pending}
          presetId={state.presetId}
          presets={state.presets}
          team={state.team}
          termCount={state.termCount}
        />
        <div className='flex min-h-0 w-full items-center justify-center'>
          {state.card ? (
            <BingoGameBoard
              card={state.card}
              disabled={Boolean(state.pending) || state.isTogglingCell}
              onToggle={state.toggleCell}
            />
          ) : (
            <BingoGameEmptyState />
          )}
        </div>
      </section>
      {state.error && <BingoGameError message={state.error} />}
    </BingoGameLayout>
  );
}
