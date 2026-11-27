'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useVariables } from '@postmill-ai/react/helpers/variable.context';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

// Pages that show their own heading (from PageIntro or from the page itself),
// so the mobile header does not repeat the title.
export const hasPageHeading = (pathname: string) =>
  ['/dashboard', '/posts', '/campaigns', '/analytics', '/replies', '/media', '/settings'].includes(pathname) ||
  pathname.startsWith('/files') ||
  pathname.startsWith('/settings/');

// Page title and subtitle above the main list pages, as in the Flows360
// publishing design. Detail pages, the Overview (its greeting is the title),
// settings (which has its own heading) and
// pages that already carry a title (Inbox, Library) are left alone.
export const PageIntro = () => {
  const t = useT();
  const pathname = usePathname() || '';
  const params = useSearchParams();
  const { isGeneral } = useVariables();

  const intro = (() => {
    switch (pathname) {
      case '/posts':
        return params?.get('display') === 'list'
          ? [t('posts', 'Posts'), t('posts_intro', 'Queue, drafts, approval and publishing history.')]
          : [
              isGeneral ? t('calendar', 'Calendar') : t('launches', 'Launches'),
              t('calendar_intro', 'See the real publishing state across channels.'),
            ];
      case '/campaigns':
        return [t('campaigns', 'Campaigns'), t('campaigns_intro', 'Plan and measure every campaign in one place.')];
      case '/analytics':
        return [t('analytics', 'Analytics'), t('analytics_intro', 'Find what worked and open the source post.')];
      default:
        return null;
    }
  })();

  if (!intro) return null;
  return (
    <div className="px-[28px] pt-[26px] pb-[6px] mobile:px-[16px] mobile:pt-[16px] flex flex-col gap-[6px]">
      <h1 className="text-[28px] mobile:text-[22px] leading-[1.2] font-[700] tracking-[-0.01em] text-textColor">
        {intro[0]}
      </h1>
      <p className="text-[14px] text-newTableText">{intro[1]}</p>
    </div>
  );
};
