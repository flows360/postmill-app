'use client';

import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useIntegrationList } from '@postmill-ai/frontend/components/launches/helpers/use.integration.list';
import { useOverview } from '@postmill-ai/frontend/components/analytics/hooks/useOverview';
import { useDashboardSummary } from './hooks/useDashboardSummary';
import { LineChart } from '@postmill-ai/frontend/components/analytics/charts/line.chart';
import { EmptyState } from '@postmill-ai/frontend/components/analytics/kit/states';
import { DashboardSetup } from './dashboard.setup';
import { SectionCard, SectionCardGate } from './kit/section-card';
import { DashboardHeader } from './dashboard.header';
import { DashboardSectionMeta } from './customize.popover';
import { greetingForUser } from './dashboard.utils';
import { KpiStrip } from './widgets/kpi.strip';
import { ScheduleTimeline } from './widgets/schedule.timeline';
import { CampaignsWidget } from './widgets/campaigns.widget';
import { InboxWidget } from './widgets/inbox.widget';
import { MediaQueueWidget } from './widgets/media.queue';
import { UsageWidget } from './widgets/usage.widget';
import { RecommendationsStrip } from './widgets/recommendations.strip';
import { AttentionFeed } from './widgets/attention.feed';
import { useAiActive } from '@postmill-ai/frontend/components/layout/use-ai-active';
import { DailyBrief } from './widgets/daily.brief';
import { ChannelsWidget } from './widgets/channels.widget';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';
import { useAttention } from './hooks/useAttention';
import { useMediaJobs } from './hooks/useMediaJobs';
import { usePermissions } from '@postmill-ai/frontend/components/layout/use-permissions';
import { ANALYTICS_USAGE_HREF, MEDIA_QUEUE_HREF } from './destinations';

export { greetingForUser };

export const DashboardComponent = () => {
  const aiActive = useAiActive();
  const t = useT();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: integrations } = useIntegrationList();
  // Same SWR keys the widgets use, so these are cache reads, not extra requests.
  const { data: attention } = useAttention();
  // Same optimistic gate SectionCard applies to the media widget: fetch until
  // permissions resolve, then stop if the user lacks media:read — otherwise a
  // restricted user's dashboard fires (and SWR retries) a 403 on every mount.
  const permissions = usePermissions();
  const canReadMedia =
    !permissions.isResolved || permissions.hasPermission('media', 'read');
  const { data: mediaJobs } = useMediaJobs(canReadMedia);

  const DASHBOARD_SECTIONS: DashboardSectionMeta[] = useMemo(
    () => [
      { id: 'setup', label: t('setup_checklist_label', 'Setup checklist') },
      { id: 'attention', label: t('needs_attention', 'Needs attention') },
      {
        id: 'kpi',
        label: t('kpi_at_a_glance', 'At a glance'),
        permission: ['analytics', 'read'],
      },
      {
        id: 'trend',
        label: t('trend_label', 'Engagement trend'),
        permission: ['analytics', 'read'],
      },
      {
        id: 'schedule',
        label: t('next_7_days', 'Next 7 days'),
        permission: ['posts', 'read'],
      },
      {
        id: 'campaigns',
        label: t('active_campaigns', 'Active campaigns'),
        permission: ['posts', 'read'],
      },
      { id: 'inbox', label: t('inbox', 'Inbox'), permission: ['comments', 'read'] },
      {
        id: 'channels',
        label: t('channels', 'Channels'),
        permission: ['channels', 'read'],
      },
      {
        id: 'media',
        label: t('media_queue', 'Media queue'),
        permission: ['media', 'read'],
      },
      {
        id: 'usage',
        label: t('usage_budget', 'Usage & budget'),
        permission: ['billing', 'read'],
      },
      {
        id: 'recommendations',
        label: t('recommendations_label', 'Recommendations'),
        permission: ['posts', 'read'],
      },
      {
        id: 'brief',
        label: t('daily_brief_section_label', 'Daily brief'),
        permission: ['analytics', 'read'],
      },
    ],
    [t]
  );

  const activeIntegrationIds = useMemo(
    // Array guard: `/integrations/list` is a shared SWR key — a non-array in
    // the cache must never crash the page (Sentry POSTMILL-APP-E).
    () => (Array.isArray(integrations) ? integrations : []).map((i: { id: string }) => i.id),
    [integrations]
  );

  const from = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const to = dayjs().format('YYYY-MM-DD');

  const { data: overviewData, isLoading: overviewLoading } = useOverview({
    from,
    to,
    integrations: activeIntegrationIds,
    compare: false,
  });

  const mainKPI = overviewData?.kpis?.[0];
  const series = useMemo(() => {
    if (!overviewData?.series || !mainKPI) return [];
    const points = overviewData.series[mainKPI.metric] || [];
    return points.map((p) => ({ ...p, date: dayjs(p.date).format(t('chart_date_format', 'M/DD')) }));
  }, [overviewData, mainKPI, t]);

  const hasOverview = !!overviewData && series.length > 0;

  const scrollToBrief = () =>
    document.getElementById('daily-brief')?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="px-[32px] pt-[28px] pb-[32px] mobile:p-[16px] overflow-x-hidden w-full">
      <DashboardHeader
        sections={DASHBOARD_SECTIONS}
        showBriefButton={aiActive === true}
        onBriefClick={scrollToBrief}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[16px] mobile:gap-[12px]">
        <div className="lg:col-span-12">
          <DashboardSetup />
        </div>

        <div className="lg:col-span-12">
          <SectionCardGate id="kpi" permission={['analytics', 'read']}>
            <KpiStrip from={from} to={to} integrationIds={activeIntegrationIds} />
          </SectionCardGate>
        </div>

        <div className="lg:col-span-8 order-2 lg:order-none">
          <SectionCard
            id="schedule"
            title={t('this_week', 'This Week')}
            subtitle={t('this_week_sub', 'Scheduled posts by day, starting today')}
            viewAllHref="/posts?display=week"
            viewAllLabel={t('open_calendar', 'Open Calendar')}
            permission={['posts', 'read']}
            className="h-full"
          >
            {summaryLoading ? (
              <div className="animate-pulse h-[200px] bg-newTableHeader rounded-[10px]" />
            ) : (
              <ScheduleTimeline upcomingPosts={summary?.upcomingPosts ?? []} />
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-1 lg:order-none">
          <SectionCard
            id="attention"
            title={t('needs_attention_title', 'Needs Attention')}
            subtitle={t('needs_attention_sub', 'Only items that need a decision from you')}
            badge={attention?.items?.length}
            className="h-full"
          >
            <AttentionFeed />
          </SectionCard>
        </div>

        <div className="lg:col-span-8 order-4 lg:order-none">
          <SectionCard
            id="trend"
            title={t('engagement_title', 'Engagement')}
            subtitle={t('engagement_sub', 'Likes, comments and shares per day · last 7 days')}
            viewAllHref="/analytics"
            viewAllLabel={t('open_analytics', 'Open Analytics')}
            permission={['analytics', 'read']}
            className="h-full"
          >
            {overviewLoading ? (
              <div className="h-[240px] bg-newTableHeader rounded-[12px] animate-pulse" />
            ) : hasOverview ? (
              <div className="h-[240px] relative w-full min-w-0">
                <LineChart series={series} height={240} format={mainKPI?.format} />
              </div>
            ) : (
              <EmptyState
                title={t('no_trend_data_title', 'No trend data yet')}
                description={t(
                  'no_trend_data_description',
                  'Publish posts and connect channels to see engagement over time.'
                )}
              />
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-3 lg:order-none">
          <DailyBrief variant="card" />
        </div>

        <div className="lg:col-span-4 order-5 lg:order-none">
          <SectionCard
            id="channels"
            title={t('channels', 'Channels')}
            subtitle={t('channels_sub', 'Where your posts go')}
            viewAllHref="/settings/channels"
            viewAllLabel={t('manage', 'Manage')}
            permission={['channels', 'read']}
            className="h-full"
          >
            <ChannelsWidget />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-6 lg:order-none">
          <SectionCard
            id="inbox"
            title={t('inbox', 'Inbox')}
            subtitle={t('inbox_card_sub', 'Latest replies across channels')}
            badge={summary?.commentUnreadCount}
            viewAllHref="/replies"
            viewAllLabel={t('open_inbox', 'Open Inbox')}
            permission={['comments', 'read']}
            className="h-full"
          >
            <InboxWidget />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-7 lg:order-none">
          <SectionCard
            id="campaigns"
            title={t('active_campaigns_title', 'Active Campaigns')}
            subtitle={t('active_campaigns_sub', 'Posts published against plan')}
            viewAllHref="/campaigns"
            viewAllLabel={t('all_campaigns', 'All Campaigns')}
            permission={['posts', 'read']}
            className="h-full"
          >
            <CampaignsWidget />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-8 lg:order-none">
          <SectionCard
            id="recommendations"
            title={t('recommendations_label', 'Recommendations')}
            subtitle={t('recommendations_sub', 'Suggested by Postmill from your results')}
            viewAllHref="/analytics?tab=insights"
            viewAllLabel={t('all', 'All')}
            permission={['posts', 'read']}
            className="h-full"
          >
            <RecommendationsStrip />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-9 lg:order-none">
          <SectionCard
            id="media"
            title={t('media_queue_title', 'Media Queue')}
            subtitle={t('media_queue_sub', 'Images and videos being made')}
            badge={mediaJobs?.counts?.failed7d}
            viewAllHref={MEDIA_QUEUE_HREF}
            viewAllLabel={t('open_queue', 'Open Queue')}
            permission={['media', 'read']}
            className="h-full"
          >
            <MediaQueueWidget />
          </SectionCard>
        </div>

        <div className="lg:col-span-4 order-10 lg:order-none">
          <SectionCard
            id="usage"
            title={t('ai_spend_title', 'AI Spend')}
            subtitle={t('ai_spend_sub', 'Against your monthly and daily caps')}
            viewAllHref={ANALYTICS_USAGE_HREF}
            viewAllLabel={t('usage', 'Usage')}
            permission={['billing', 'read']}
            className="h-full"
          >
            <UsageWidget />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
