import { createFileRoute } from '@tanstack/react-router';

import { getActiveGameCount } from '#/app/home/api';
import { HomeLayout } from '#/app/home/layout';
import { HomeCallToAction, HomeFooter, HomeHeader, HomeHero, HomeHowItWorks, HomeLiveGames } from '#/app/home/sections';

export const Route = createFileRoute('/')({
  loader: () => getActiveGameCount(),
  component: HomeRoute,
});

function HomeRoute() {
  const { count } = Route.useLoaderData();

  return (
    <HomeLayout>
      <HomeHeader />
      <HomeHero />
      <HomeLiveGames initialActiveGameCount={count} />
      <HomeHowItWorks />
      <HomeCallToAction />
      <HomeFooter />
    </HomeLayout>
  );
}
