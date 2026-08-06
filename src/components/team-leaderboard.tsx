import { ChevronRight, Trophy } from "lucide-react";

import { ButtonLink } from "#/components/ui/button-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";

export type TeamLeaderboardEntry = {
  activity: "ranked" | "playing" | "inactive";
  cardsStarted: number;
  completedCards: number;
  id: string;
  name: string;
  rank: number | null;
};

export function TeamLeaderboardPreview({
  leaderboard,
  teamId,
}: {
  leaderboard: TeamLeaderboardEntry[];
  teamId: string;
}) {
  const leadingMembers = leaderboard.filter((member) => member.activity === "ranked").slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-primary dark:text-violet-300" aria-hidden="true" />
          Team leaderboard
        </CardTitle>
        <CardDescription>The top bingo scores in your team.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {leadingMembers.length ? (
          <ol className="grid gap-2" aria-label="Leading team members">
            {leadingMembers.map((member) => (
              <li className="flex items-center gap-3 rounded-lg bg-muted/45 p-3" key={member.id}>
                <span className="w-5 shrink-0 text-center text-sm font-semibold text-primary">
                  {member.rank}
                </span>
                <p className="min-w-0 flex-1 truncate font-medium">{member.name}</p>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {formatBingoCount(member.completedCards)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg bg-muted/45 p-3 text-sm text-muted-foreground">
            Complete a bingo card to start the leaderboard.
          </p>
        )}
        <ButtonLink
          className="mt-auto w-full"
          params={{ teamId }}
          to="/teams/$teamId/leaderboard"
          variant="outline"
        >
          View leaderboard
          <ChevronRight aria-hidden="true" />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

export function TeamLeaderboard({ leaderboard }: { leaderboard: TeamLeaderboardEntry[] }) {
  const rankedMembers = leaderboard.filter((member) => member.activity === "ranked");

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Completed bingo cards set the score. Equal scores share a place; only this team can see
          the leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {rankedMembers.length ? (
          <ol className="grid gap-2" aria-label="Ranked team members">
            {rankedMembers.map((member) => (
              <li
                className="flex items-center gap-3 rounded-lg border bg-muted/35 p-3"
                key={member.id}
              >
                <span
                  aria-label={`Place ${member.rank}`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary"
                >
                  {member.rank}
                </span>
                <p className="min-w-0 flex-1 truncate font-medium">{member.name}</p>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {formatBingoCount(member.completedCards)}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg bg-muted/45 p-3 text-sm text-muted-foreground">
            Complete a bingo card to start the leaderboard.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatBingoCount(count: number) {
  return `${count} ${count === 1 ? "bingo" : "bingos"}`;
}
