'use client';

import { FC } from 'react';
import Link from 'next/link';
import { useIntegrationList } from '@postmill-ai/frontend/components/launches/helpers/use.integration.list';
import { ChannelAvatar } from '@postmill-ai/frontend/components/analytics/kit/channel-avatar';
import { EmptyState } from '@postmill-ai/frontend/components/analytics/kit/states';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

interface ChannelRow {
  id: string;
  name: string;
  picture?: string;
  identifier?: string;
  display?: string;
  disabled?: boolean;
  refreshNeeded?: boolean;
  inBetweenSteps?: boolean;
}

// How many channels the card lists; the rest are one click away in Settings.
const MAX_ROWS = 5;

const TONE: Record<string, string> = {
  green: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  grey: 'bg-newTableHeader text-newTableText',
};

export const ChannelsWidget: FC = () => {
  const t = useT();
  const { data } = useIntegrationList();
  const channels: ChannelRow[] = Array.isArray(data) ? data : [];

  if (!channels.length) {
    return (
      <EmptyState
        title={t('no_channels_title', 'No channels yet')}
        description={t('no_channels_description', 'Connect a channel to start publishing.')}
      />
    );
  }

  // Channels that need you come first.
  const rank = (c: ChannelRow) => (c.refreshNeeded ? 0 : c.inBetweenSteps ? 1 : c.disabled ? 3 : 2);
  const rows = [...channels].sort((a, b) => rank(a) - rank(b)).slice(0, MAX_ROWS);

  return (
    <div className="flex flex-col">
      {rows.map((c, i) => {
        const [label, tone] = c.refreshNeeded
          ? [t('reconnect', 'Reconnect'), 'red']
          : c.inBetweenSteps
            ? [t('finish_setup', 'Finish Setup'), 'amber']
            : c.disabled
              ? [t('disabled', 'Disabled'), 'grey']
              : [t('connected', 'Connected'), 'green'];
        return (
          <Link
            key={c.id}
            href="/settings/channels"
            data-testid="channel-row"
            className={`flex items-center gap-[12px] py-[10px] min-w-0 hover:bg-boxHover -mx-[8px] px-[8px] rounded-[6px] ${
              i ? 'border-t border-newTableBorder' : ''
            }`}
          >
            <ChannelAvatar src={c.picture} identifier={c.identifier} name={c.name} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-[700] text-textColor truncate">{c.name}</span>
              <span className="block text-[11.5px] text-newTableText truncate">
                {c.display || c.identifier}
              </span>
            </span>
            <span className={`shrink-0 text-[11px] font-[700] px-[9px] py-[3px] rounded-full ${TONE[tone]}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
