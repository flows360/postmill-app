'use client';

import { FC } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useUser } from '@postmill-ai/frontend/components/layout/user.context';
import { getTimezone } from '@postmill-ai/frontend/components/layout/set.timezone';
import { Button } from '@postmill-ai/react/form/button';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';
import { KebabMenu } from '@postmill-ai/frontend/components/ui/kebab-menu';
import { CustomizePopover, DashboardSectionMeta } from './customize.popover';
import { greetingForUser } from './dashboard.utils';
import { useDashboardSummary } from './hooks/useDashboardSummary';

// Plain text of a post for the one-line summary under the greeting.
const snippet = (content: string | null, max = 40) => {
  const text = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, '') + '…' : text;
};

interface DashboardHeaderProps {
  sections: DashboardSectionMeta[];
  showBriefButton?: boolean;
  onBriefClick?: () => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({
  sections,
  showBriefButton,
  onBriefClick,
}) => {
  const router = useRouter();
  const user = useUser();
  const t = useT();

  const firstName =
    user?.profile?.name?.trim().split(/\s+/)[0] ||
    t('greeting_fallback_name', 'there');
  const hour = dayjs().tz(getTimezone()).hour();
  const greeting = greetingForUser(firstName, hour, t);

  const { data: summary } = useDashboardSummary();
  const tz = getTimezone();
  const now = dayjs().tz(tz);
  const dateLabel = now.format(t('dashboard_date_format', 'dddd D MMMM'));

  // One line that says what happens today, from the posts already scheduled.
  const upcoming = (summary?.upcomingPosts ?? [])
    .filter((p) => dayjs(p.publishDate).isAfter(dayjs()))
    .sort((a, b) => dayjs(a.publishDate).valueOf() - dayjs(b.publishDate).valueOf());
  const todayCount = upcoming.filter((p) => dayjs(p.publishDate).tz(tz).isSame(now, 'day')).length;
  const next = upcoming[0];
  const parts = [dateLabel];
  if (summary) {
    parts.push(
      todayCount === 0
        ? t('dashboard_nothing_today', 'nothing scheduled for the rest of today')
        : todayCount === 1
          ? t('dashboard_one_today', '1 post goes out today')
          : t('dashboard_n_today', '{{count}} posts go out today', { count: todayCount })
    );
  }
  if (next) {
    parts.push(
      t('dashboard_next_post', 'next is {{title}} on {{channel}} at {{time}}', {
        title: snippet(next.content) || t('untitled', 'Untitled'),
        channel: next.channelName || t('a_channel', 'a channel'),
        time: dayjs(next.publishDate).tz(tz).format(
          dayjs(next.publishDate).tz(tz).isSame(now, 'day') ? 'HH:mm' : 'ddd HH:mm'
        ),
      })
    );
  }

  const secondary =
    'bg-newBgColorInner text-textColor border border-newTableBorder hover:bg-boxHover px-[14px] h-[38px] text-[14px] font-[600] rounded-[8px]';

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-[24px] gap-y-[16px] mb-[24px]">
      <div className="min-w-0">
        <h1 className="text-[28px] mobile:text-[22px] leading-[1.2] font-[700] tracking-[-0.01em] text-textColor">
          {greeting}
        </h1>
        <p className="text-[14px] text-newTableText mt-[6px]">{parts.join(' · ')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        {showBriefButton && (
          <Button
            secondary
            onClick={onBriefClick}
            className={secondary}
            aria-label={t('daily_brief_section_label', 'Daily brief')}
          >
            <span className="me-[6px] text-btnPrimaryAccent">✦</span>
            {t('daily_brief', 'Daily Brief')}
          </Button>
        )}
        {/* Two ways to make a design, so the button is a menu rather than a
            guess at which one you wanted. KebabMenu supplies the menu behaviour. */}
        <KebabMenu
          ariaLabel={t('new_design_aria', 'New design')}
          align="left"
          width={200}
          triggerClassName={`${secondary} gap-[6px] focus-visible:ring-2 ring-btnPrimary/40 outline-hidden`}
          trigger={
            <>
              {t('new_design', 'New Design')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </>
          }
          items={[
            {
              label: t('designer', 'Designer'),
              onClick: () => router.push('/media/designer'),
            },
            {
              label: t('ai_designer', 'AI Designer'),
              onClick: () => router.push('/media/ai-designer'),
            },
          ]}
        />
        <Button
          secondary
          onClick={() => router.push('/campaigns?new=1')}
          className={secondary}
          aria-label={t('new_campaign_aria', 'New campaign')}
        >
          {t('new_campaign', 'New Campaign')}
        </Button>
        <Button
          onClick={() => router.push('/posts/post')}
          className="px-[16px] h-[38px] text-[14px] font-[600] rounded-[8px]"
          aria-label={t('new_post_aria', 'New post')}
        >
          {t('new_post', 'New Post')}
        </Button>
        <CustomizePopover sections={sections} />
      </div>
    </div>
  );
};
