'use client';
import { FC, ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';

// The calendar and the post list share /posts and differ only by ?display=.
// A menu path with a display query is active only for that view; the list view
// owns "list" and the calendar owns every other display.
const useIsActive = (path: string) => {
  const currentPath = usePathname() || '';
  const params = useSearchParams();
  const [base, query] = path.split('?');
  if (currentPath.indexOf(base) !== 0) return false;
  const wanted = new URLSearchParams(query || '').get('display');
  if (!wanted) return true;
  const current = params?.get('display');
  return wanted === 'list' ? current === 'list' : current !== 'list';
};

export const MenuItem: FC<{ label: string; icon: ReactNode; path: string; onClick?: () => void; badge?: number }> = ({
  label,
  path,
  onClick,
  badge,
}) => {
  const isActive = useIsActive(path);

  // Text-only rows, as in the Flows360 publishing design. Icons stay on the
  // mobile bottom bar, which reuses the same menu data.
  const className = clsx(
    'group relative w-full h-[38px] px-[14px] flex items-center rounded-[8px] text-[14px] text-start whitespace-nowrap transition-colors',
    isActive
      ? 'text-textItemFocused bg-boxFocused font-[700]'
      : 'text-textItemBlur font-[500] hover:bg-boxHover hover:text-textItemFocused'
  );

  const inner = (
    <>
      <div className="min-w-0 flex-1 truncate leading-[1.2]">{label}</div>
      {badge !== undefined && badge > 0 && (
        <div className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-[#795413] text-[11px] font-[700] text-white px-[6px]">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} title={label} className={className}>
        {inner}
      </button>
    );
  }

  return (
    <Link
      prefetch={true}
      href={path}
      title={label}
      {...path.indexOf('http') === 0 && { target: '_blank' }}
      className={className}
    >
      {inner}
    </Link>
  );
};
