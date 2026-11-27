'use client';

import { FC, useMemo } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useSchedule } from '../hooks/useSchedule';
import { EmptyState, TabSkeleton } from '@postmill-ai/frontend/components/analytics/kit/states';
import { ChannelAvatar } from '@postmill-ai/frontend/components/analytics/kit/channel-avatar';
import { getTimezone } from '@postmill-ai/frontend/components/layout/set.timezone';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

interface UpcomingPost {
  id: string;
  content: string | null;
  publishDate: string;
  channelName: string | null;
  providerIdentifier: string | null;
}

interface ScheduleTimelineProps {
  upcomingPosts?: UpcomingPost[];
}

// How many post chips a day column shows before "+N more".
const MAX_CHIPS = 3;

// Plain text of a post for a one-line chip.
const plain = (content: string | null) =>
  (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Formats a time in the user's timezone. Falls back to plain dayjs where the
// timezone plugin is not loaded (tests).
const timeOf = (iso: string) => {
  try {
    return dayjs(iso).tz(getTimezone()).format('HH:mm');
  } catch {
    return dayjs(iso).format('HH:mm');
  }
};

export const ScheduleTimeline: FC<ScheduleTimelineProps> = ({ upcomingPosts = [] }) => {
  const t = useT();
  const router = useRouter();
  const { data: schedule, isLoading } = useSchedule(7);

  const postsByDay = useMemo(() => {
    const map = new Map<string, UpcomingPost[]>();
    if (!upcomingPosts) return map;
    for (const post of [...upcomingPosts].sort(
      (a, b) => dayjs(a.publishDate).valueOf() - dayjs(b.publishDate).valueOf()
    )) {
      const day = dayjs(post.publishDate).format('YYYY-MM-DD');
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(post);
    }
    return map;
  }, [upcomingPosts]);

  if (isLoading) {
    return <TabSkeleton variant="list" />;
  }

  if (!schedule?.days.length) {
    return (
      <EmptyState
        title={t('no_schedule_data_title', 'No schedule data')}
        description={t('no_schedule_data_description', 'Create a post to fill your calendar.')}
      />
    );
  }

  return (
    <div className="grid grid-cols-7 tablet:flex tablet:overflow-x-auto gap-[8px] pb-[4px]">
      {schedule.days.map((day, index) => {
        const isToday = index === 0;
        const isGap = schedule.gaps.includes(day.date);
        const dayPosts = postsByDay.get(day.date) ?? [];
        const label = `${dayjs(day.date).format(t('schedule_day_abbrev_format', 'ddd'))} ${dayjs(
          day.date
        ).format(t('schedule_day_number_format', 'D'))}`;
        return (
          <div
            key={day.date}
            data-testid={`schedule-day-${day.date}`}
            className={`min-w-0 tablet:shrink-0 tablet:w-[120px] rounded-[10px] border p-[6px] flex flex-col gap-[6px] min-h-[200px] ${
              isToday
                ? 'border-btnPrimaryAccent/40 bg-boxFocused/60'
                : 'border-newTableBorder bg-newTableHeader/60'
            }`}
          >
            <div
              className={`text-center text-[12px] font-[700] rounded-[6px] py-[4px] ${
                isToday ? 'bg-btnPrimary text-white' : 'text-textColor'
              }`}
            >
              {label}
            </div>
            <div className="text-center text-[11px] text-newTableText">
              {day.count === 0
                ? t('nothing_yet', 'Nothing yet')
                : day.count === 1
                  ? t('one_post', '1 post')
                  : t('n_posts', '{{count}} posts', { count: day.count })}
            </div>

            {dayPosts.slice(0, MAX_CHIPS).map((post) => (
              // The chip holds a real post id, so it opens that post.
              <button
                key={post.id}
                type="button"
                onClick={() => router.push(`/posts?post=${post.id}`)}
                className="bg-newBgColorInner border border-newTableBorder rounded-[8px] px-[6px] py-[6px] text-start hover:border-btnPrimaryAccent/50 transition-colors min-w-0"
                title={plain(post.content) || undefined}
              >
                <span className="flex items-center gap-[5px] min-w-0">
                  <ChannelAvatar
                    identifier={post.providerIdentifier ?? undefined}
                    name={post.channelName ?? undefined}
                    size={14}
                  />
                  <span className="text-[11.5px] font-[700] text-textColor tabular-nums">
                    {timeOf(post.publishDate)}
                  </span>
                </span>
                <span className="block text-[10.5px] text-newTableText truncate mt-[2px]">
                  {plain(post.content) || t('untitled', 'Untitled')}
                </span>
              </button>
            ))}
            {dayPosts.length > MAX_CHIPS && (
              <button
                type="button"
                onClick={() => router.push('/posts?display=week')}
                className="text-[11px] font-[600] text-btnPrimaryAccent hover:underline"
              >
                {t('n_more', '+{{count}} more', { count: dayPosts.length - MAX_CHIPS })}
              </button>
            )}

            {(isGap || day.count === 0) && (
              <button
                type="button"
                onClick={() => router.push(`/posts/post?date=${day.date}T10:00:00`)}
                className="mt-auto text-[11.5px] font-[600] text-btnPrimaryAccent hover:underline py-[6px]"
              >
                + {t('dashboard_add_post', 'Add Post')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
