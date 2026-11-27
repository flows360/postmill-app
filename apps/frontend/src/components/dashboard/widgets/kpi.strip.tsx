'use client';

import { FC, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOverview } from '@postmill-ai/frontend/components/analytics/hooks/useOverview';
import { formatCompactNumber } from '@postmill-ai/frontend/components/analytics/utils';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useSchedule } from '../hooks/useSchedule';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

interface KpiStripProps {
  from: string;
  to: string;
  integrationIds: string[];
}

// A small line drawn from the engagement sparkline.
const Sparkline: FC<{ values: number[] }> = ({ values }) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 92},${38 - ((v - min) / (max - min || 1)) * 34}`)
    .join(' ');
  return (
    <svg width="92" height="42" viewBox="0 0 92 42" aria-hidden="true" data-testid="kpi-sparkline">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// One bar per day for the next 7 days; today is the dark one.
const DayBars: FC<{ counts: number[] }> = ({ counts }) => {
  if (!counts.length) return null;
  const max = Math.max(1, ...counts);
  return (
    <div className="flex items-end gap-[5px] h-[46px]" aria-hidden="true" data-testid="kpi-day-bars">
      {counts.map((c, i) => (
        <span
          key={i}
          className={`w-[9px] rounded-[3px] ${i === 0 ? 'bg-btnPrimary' : 'bg-[#C9D6E4] dark:bg-newTableBorder'}`}
          style={{ height: `${6 + (c / max) * 40}px` }}
        />
      ))}
    </div>
  );
};

interface Tile {
  id: string;
  title: string;
  sub: string;
  value: string;
  foot: string;
  href: string;
  visual?: ReactNode;
}

export const KpiStrip: FC<KpiStripProps> = ({ from, to, integrationIds }) => {
  const t = useT();
  const router = useRouter();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: schedule } = useSchedule(7);
  const { data: overview, isLoading: overviewLoading } = useOverview({
    from,
    to,
    integrations: integrationIds,
    compare: false,
  });

  const tiles: Tile[] = useMemo(() => {
    const engagement = overview?.kpis?.[0];
    const channels = summary?.channelsConnected ?? integrationIds.length;
    const dayCounts = (schedule?.days ?? []).map((d) => d.count);
    const today = dayCounts[0] ?? 0;
    return [
      {
        id: 'scheduled',
        title: t('kpi_scheduled', 'Scheduled'),
        sub: t('kpi_scheduled_sub', 'Waiting to go out'),
        value: formatCompactNumber(summary?.scheduledPosts ?? 0),
        foot:
          today === 1
            ? t('kpi_one_today', '1 today')
            : t('kpi_n_today', '{{count}} today', { count: today }),
        href: '/posts?display=week',
        visual: <DayBars counts={dayCounts} />,
      },
      {
        id: 'published',
        title: t('kpi_published', 'Published'),
        sub: t('last_7_days_lower', 'Last 7 days'),
        value: formatCompactNumber(summary?.publishedNext7 ?? 0),
        foot:
          channels === 1
            ? t('kpi_one_channel', 'Across 1 channel')
            : t('kpi_n_channels', 'Across {{count}} channels', { count: channels }),
        href: '/analytics?tab=posts',
      },
      {
        id: 'engagement',
        title: t('kpi_engagement', 'Engagement'),
        sub: t('last_7_days_lower', 'Last 7 days'),
        value: formatCompactNumber(engagement?.total ?? 0),
        foot: t('kpi_engagement_foot', 'Likes, comments and shares'),
        href: '/analytics',
        visual: (
          <span className="text-btnPrimaryAccent">
            <Sparkline values={(engagement?.sparkline ?? []).map((p) => p.value)} />
          </span>
        ),
      },
      {
        id: 'unread',
        title: t('kpi_unread_replies_title', 'Unread Replies'),
        sub: t('inbox', 'Inbox'),
        value: formatCompactNumber(summary?.commentUnreadCount ?? 0),
        foot: t('kpi_unread_foot', 'Waiting for a reply from you'),
        href: '/replies?unreadOnly=true',
      },
    ];
  }, [overview?.kpis, summary, schedule?.days, integrationIds.length, t]);

  const loading = summaryLoading || overviewLoading;

  return (
    <div className="grid grid-cols-4 tablet:grid-cols-2 gap-[16px] mobile:gap-[10px]">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          data-testid={`kpi-tile-${tile.id}`}
          onClick={() => router.push(tile.href)}
          className="text-start bg-newBgColorInner border border-newTableBorder rounded-[12px] px-[20px] py-[16px] mobile:px-[14px] mobile:py-[12px] hover:border-btnPrimaryAccent/50 transition-colors min-w-0"
        >
          <div className="text-[13px] font-[700] text-textColor/90">{tile.title}</div>
          <div className="text-[12px] text-newTableText mt-[2px]">{tile.sub}</div>
          <div className="flex items-end justify-between gap-[8px] mt-[6px] min-h-[46px]">
            {loading ? (
              <span className="h-[36px] w-[70px] bg-newTableHeader rounded-[6px] animate-pulse" />
            ) : (
              <span className="text-[32px] mobile:text-[24px] leading-[1.1] font-[700] tracking-tight tabular-nums text-textColor">
                {tile.value}
              </span>
            )}
            <span className="mobile:hidden">{tile.visual}</span>
          </div>
          <div className="text-[12px] text-newTableText mt-[8px] truncate">{tile.foot}</div>
        </button>
      ))}
    </div>
  );
};
