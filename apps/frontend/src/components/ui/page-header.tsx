import React, { FC, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Top-level page heading, styled like the Flows360 page intros. */
  large?: boolean;
}

export const PageHeader: FC<PageHeaderProps> = ({ title, description, action, large }) => {
  return (
    <div className="flex items-center justify-between gap-[12px] mb-[20px]">
      <div className="min-w-0">
        <h1
          className={
            large
              ? 'text-[28px] mobile:text-[22px] leading-[1.2] font-[700] tracking-[-0.01em] text-textColor'
              : 'text-[20px] mobile:text-[24px] font-[600] text-textColor'
          }
        >
          {title}
        </h1>
        {description && (
          <p className={large ? 'text-[14px] text-newTableText mt-[6px]' : 'text-[13px] text-newTableText mt-[4px]'}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-[8px]">{action}</div>
      )}
    </div>
  );
};
