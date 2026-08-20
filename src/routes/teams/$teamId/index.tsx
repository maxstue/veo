import { createFileRoute, redirect } from '@tanstack/react-router';

import { listGameSessions } from '#/app/game-session/api';
import { getTeam } from '#/app/teams/api';
import { TeamInvitationsPreview } from '#/app/teams/invitations/team-invitations';
import { TeamLeaderboardPreview } from '#/app/teams/leaderboard/team-leaderboard';
import { TeamBingoRulesPreview } from '#/app/teams/team-bingo-rules';
import { TeamMembersPreview } from '#/app/teams/team-members';
import { TeamOverviewGrid, TeamOverviewHeading, TeamOverviewLayout, TeamSessions } from '#/app/teams/team-overview';
import { TeamTermsPreview } from '#/app/teams/terms/team-terms';

export const Route = createFileRoute('/teams/$teamId/')({
  beforeLoad: ({ context, params }) => {
    if (!context.session) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}` } });
    }
  },
  loader: async ({ params }) => {
    const [team, sessions] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      listGameSessions({ data: { teamId: params.teamId } }),
    ]);
    return { ...team, sessions };
  },
  component: TeamRoute,
});

function TeamRoute() {
  const data = Route.useLoaderData();
  const { teamId } = Route.useParams();
  return (
    <TeamOverviewLayout>
      <TeamOverviewHeading name={data.team.name} />
      <TeamOverviewGrid>
        <TeamSessions sessions={data.sessions} teamId={teamId} />
        <TeamMembersPreview members={data.members} teamId={teamId} />
        <TeamTermsPreview teamId={teamId} terms={data.terms} />
        <TeamBingoRulesPreview presets={data.bingoRulesPresets} rules={data.team.bingoRules} teamId={teamId} />
        <TeamLeaderboardPreview leaderboard={data.leaderboard} teamId={teamId} />
        {data.team.viewerRole === 'owner' && <TeamInvitationsPreview invitations={data.invitations} teamId={teamId} />}
      </TeamOverviewGrid>
    </TeamOverviewLayout>
  );
}
