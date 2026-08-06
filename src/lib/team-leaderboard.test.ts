import { describe, expect, test } from "vite-plus/test";

import { buildTeamLeaderboard } from "./team-leaderboard";

describe("team leaderboard", () => {
  test("uses completed bingo cards as the score and gives tied scores the same rank", () => {
    const leaderboard = buildTeamLeaderboard(
      [
        { id: "ada", name: "Ada" },
        { id: "bea", name: "Bea" },
        { id: "cam", name: "Cam" },
      ],
      [
        { memberId: "ada", cardsStarted: 3, completedCards: 2 },
        { memberId: "bea", cardsStarted: 4, completedCards: 2 },
        { memberId: "cam", cardsStarted: 5, completedCards: 1 },
      ],
    );

    expect(leaderboard).toMatchObject([
      { id: "ada", completedCards: 2, rank: 1, activity: "ranked" },
      { id: "bea", completedCards: 2, rank: 1, activity: "ranked" },
      { id: "cam", completedCards: 1, rank: 3, activity: "ranked" },
    ]);
  });

  test("leaves members without a completed bingo unranked", () => {
    const leaderboard = buildTeamLeaderboard(
      [
        { id: "ada", name: "Ada" },
        { id: "bea", name: "Bea" },
        { id: "cam", name: "Cam" },
      ],
      [
        { memberId: "ada", cardsStarted: 1, completedCards: 1 },
        { memberId: "bea", cardsStarted: 1, completedCards: 0 },
      ],
    );

    expect(leaderboard).toMatchObject([
      { id: "ada", rank: 1, activity: "ranked" },
      { id: "bea", rank: null, activity: "playing" },
      { id: "cam", rank: null, activity: "inactive" },
    ]);
  });
});
