export type TeamBingoActivity = {
  memberId: string;
  cardsStarted: number;
  completedCards: number;
};

type LeaderboardMember = { id: string; name: string };

export type TeamLeaderboardEntry<TMember extends LeaderboardMember> = TMember & {
  activity: "ranked" | "playing" | "inactive";
  cardsStarted: number;
  completedCards: number;
  rank: number | null;
};

type LeaderboardActivity = TeamLeaderboardEntry<LeaderboardMember>["activity"];

/**
 * Ranks only completed bingo cards. This keeps the score easy to understand
 * and lets equal scores share a place instead of relying on a hidden tiebreaker.
 */
export function buildTeamLeaderboard<TMember extends LeaderboardMember>(
  members: readonly TMember[],
  activities: readonly TeamBingoActivity[],
): TeamLeaderboardEntry<TMember>[] {
  const activitiesByMemberId = new Map(activities.map((activity) => [activity.memberId, activity]));
  const entries: TeamLeaderboardEntry<TMember>[] = members.map((member) => {
    const activity = activitiesByMemberId.get(member.id);
    const cardsStarted = activity?.cardsStarted ?? 0;
    const completedCards = activity?.completedCards ?? 0;

    return {
      ...member,
      cardsStarted,
      completedCards,
      activity: getActivity(cardsStarted, completedCards),
      rank: null,
    };
  });

  const ranked = entries
    .filter((entry) => entry.activity === "ranked")
    .sort(compareEntries)
    .map((entry, _index, rankedEntries) => ({
      ...entry,
      rank:
        rankedEntries.findIndex((candidate) => candidate.completedCards === entry.completedCards) +
        1,
    }));
  const unranked = entries
    .filter((entry) => entry.activity !== "ranked")
    .sort(
      (left, right) =>
        activityOrder(left.activity) - activityOrder(right.activity) || compareEntries(left, right),
    );

  return [...ranked, ...unranked];
}

function getActivity(cardsStarted: number, completedCards: number): LeaderboardActivity {
  if (completedCards > 0) return "ranked";
  if (cardsStarted > 0) return "playing";
  return "inactive";
}

function compareEntries(
  left: LeaderboardMember & { completedCards: number },
  right: LeaderboardMember & { completedCards: number },
) {
  return (
    right.completedCards - left.completedCards ||
    left.name.localeCompare(right.name) ||
    left.id.localeCompare(right.id)
  );
}

function activityOrder(activity: LeaderboardActivity) {
  return activity === "playing" ? 0 : 1;
}
