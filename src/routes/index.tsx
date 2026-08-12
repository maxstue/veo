import { createFileRoute } from '@tanstack/react-router';

import { HomeLayout } from '#/app/home/layout';
import { HomeCallToAction, HomeFooter, HomeHeader, HomeHero, HomeHowItWorks } from '#/app/home/sections';

export const Route = createFileRoute('/')({ component: HomeRoute });

function HomeRoute() {
  return (
    <HomeLayout>
      <HomeHeader />
      <HomeHero />
      <HomeHowItWorks />
      <HomeCallToAction />
      <HomeFooter />
    </HomeLayout>
  );
}
