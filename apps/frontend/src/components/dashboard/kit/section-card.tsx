'use client';

import { FC, ReactNode } from 'react';
import Link from 'next/link';
import { useDashboardPrefs } from '../hooks/useDashboardPrefs';
import { ErrorBoundary } from '@postmill-ai/frontend/components/analytics/error.boundary';
import { ErrorState } from '@postmill-ai/frontend/components/analytics/kit/states';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

import { usePermissions } from '@postmill-ai/frontend/components/layout/use-permissions';

export interface SectionCardProps {
  id: string;
  title: string;
  /** One line under the title, as in the Flows360 design. */
  subtitle?: string;
  /** Text for the header link; defaults to "View all". */
  viewAllLabel?: string;
  /** Extra content on the right of the header (a status pill, say). */
  aside?: ReactNode;
  className?: string;
  icon?: ReactNode;
  badge?: number;
  viewAllHref?: string;
  permission?: [string, string];
  children: ReactNode;
}

export const SectionCard: FC<SectionCardProps> = ({
  id,
  title,
  subtitle,
  viewAllLabel,
  aside,
  className,
  icon,
  badge,
  viewAllHref,
  permission,
  children,
}) => {
  const { hidden } = useDashboardPrefs();
  const permissions = usePermissions();
  const t = useT();

  if (hidden.includes(id)) {
    return null;
  }

  // Optimistic: render while permissions are loading. Once resolved, hide if
  // the user lacks the required permission.
  if (permission && permissions.isResolved && !permissions.hasPermission(...permission)) {
    return null;
  }

  return (
    <div
      data-section-id={id}
      className={
        'bg-newBgColorInner border border-newTableBorder rounded-[12px] min-w-0 overflow-hidden flex flex-col ' +
        (className || '')
      }
    >
      <div className="flex items-start justify-between gap-[12px] px-[20px] pt-[18px]">
        <div className="flex items-start gap-[8px] min-w-0">
          {icon && (
            <span className="text-btnPrimaryAccent shrink-0 w-[18px] h-[22px] flex items-center justify-center">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-[8px] min-w-0">
              <h2 className="text-[16px] font-[700] text-textColor truncate">{title}</h2>
              {badge !== undefined && badge > 0 && (
                <span className="shrink-0 min-w-[20px] h-[20px] px-[6px] flex items-center justify-center rounded-full bg-amber-100 text-[11px] font-[700] text-amber-800">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[12.5px] text-newTableText mt-[4px]">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-[10px] shrink-0">
          {aside}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="shrink-0 text-[13px] font-[600] text-btnPrimaryAccent hover:underline"
            >
              {viewAllLabel || t('view_all', 'View all')} →
            </Link>
          )}
        </div>
      </div>
      <div className="px-[20px] pt-[16px] pb-[20px] min-w-0 flex-1">
        <ErrorBoundary
          fallback={
            <ErrorState
              title={t('section_failed_title', 'This section failed to load')}
              message={t(
                'section_failed_message',
                'Something went wrong inside this dashboard card.'
              )}
            />
          }
        >
          {children}
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Applies the same hide-preference and permission rules as SectionCard, for a
// section that draws its own boxes (the number tiles).
export const SectionCardGate: FC<{
  id: string;
  permission?: [string, string];
  children: ReactNode;
}> = ({ id, permission, children }) => {
  const { hidden } = useDashboardPrefs();
  const permissions = usePermissions();
  if (hidden.includes(id)) return null;
  if (permission && permissions.isResolved && !permissions.hasPermission(...permission)) {
    return null;
  }
  return <div data-section-id={id}>{children}</div>;
};
