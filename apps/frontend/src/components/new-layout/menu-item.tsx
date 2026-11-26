'use client';
import { FC, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import Link from 'next/link';

export const MenuItem: FC<{ label: string; icon: ReactNode; path: string; onClick?: () => void; badge?: number }> = ({
  label,
  icon,
  path,
  onClick,
  badge,
}) => {
  const currentPath = usePathname();
  const isActive = currentPath.indexOf(path) === 0;

  const className = clsx(
    'group relative w-full min-h-[38px] py-[8px] px-[12px] gap-[12px] flex items-center rounded-[6px] text-[13px] font-[500] text-start hover:text-textItemFocused hover:bg-boxHover transition-colors',
    isActive
      ? 'text-textItemFocused bg-boxHover font-[700]'
      : 'text-textItemBlur'
  );

  const inner = (
    <>
      <div className="w-[20px] h-[20px] shrink-0 flex items-center justify-center">{icon}</div>
      <div className="min-w-0 truncate leading-[1.2]">
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <div className="absolute top-[4px] right-[4px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-btnPrimary text-[9px] font-[600] text-white px-[4px]">
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
