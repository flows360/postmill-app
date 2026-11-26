'use client';

import { useSearchParams } from 'next/navigation';
import { LaunchesComponent } from '@postmill-ai/frontend/components/launches/launches.component';

// Calendar and Posts are two menu entries for the same /posts page. The
// calendar reads its view from ?display= when it starts, so moving between the
// list and the calendar views starts it again with the chosen view.
export const PostsView = () => {
  const params = useSearchParams();
  const view = params?.get('display') === 'list' ? 'list' : 'calendar';
  return <LaunchesComponent key={view} />;
};
