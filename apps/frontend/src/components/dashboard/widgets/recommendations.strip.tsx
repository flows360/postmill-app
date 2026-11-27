'use client';

import { FC } from 'react';
import { useRouter } from 'next/navigation';
import {
  useRecommendations,
  RecommendationItem,
} from '@postmill-ai/frontend/components/analytics/hooks/useRecommendations';
import { EmptyState, TabSkeleton } from '@postmill-ai/frontend/components/analytics/kit/states';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

const priorityClass = (priority: number) => {
  const base = 'text-[10px] font-semibold px-[6px] py-[2px] rounded-full border';
  if (priority === 1) return `${base} text-(--negative,#f97066) border-(--negative,#f97066)`;
  if (priority === 2) return `${base} text-amber-700 dark:text-amber-400 border-amber-500`;
  return `${base} text-(--chart-3,#1d9bf0) border-(--chart-3,#1d9bf0)`;
};

export const RecommendationsStrip: FC = () => {
  const router = useRouter();
  const t = useT();
  const { data, isLoading } = useRecommendations();

  if (isLoading) return <TabSkeleton variant="list" />;

  const items: RecommendationItem[] = data?.recommendations?.slice(0, 4) ?? [];

  if (!items.length) return null;

  return (
    <div className="flex flex-col">
      {items.slice(0, 3).map((item, i) => (
        <div
          key={`${item.type}-${item.title}`}
          className={`flex items-start gap-[12px] py-[10px] min-w-0 ${i ? 'border-t border-newTableBorder' : ''}`}
        >
          <span
            aria-hidden="true"
            className={`mt-[6px] shrink-0 w-[8px] h-[8px] rounded-full ${
              item.priority === 1 ? 'bg-red-600' : item.priority === 2 ? 'bg-amber-500' : 'bg-btnPrimaryAccent'
            }`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-[700] text-textColor line-clamp-1" title={item.title}>
              {item.title}
            </h3>
            <p className="text-[11.5px] text-newTableText line-clamp-2 mt-[2px]">
              <span className="sr-only">
                {item.priority === 1
                  ? t('priority_high', 'High')
                  : item.priority === 2
                    ? t('priority_medium', 'Medium')
                    : t('priority_low', 'Low')}
                {': '}
              </span>
              {item.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(item.link)}
            className="shrink-0 h-[30px] px-[10px] text-[12px] font-[600] rounded-[7px] border border-newTableBorder bg-newBgColorInner text-textColor hover:bg-boxHover transition-colors max-w-[120px] truncate"
            title={item.action}
          >
            {item.action}
          </button>
        </div>
      ))}
    </div>
  );
};
