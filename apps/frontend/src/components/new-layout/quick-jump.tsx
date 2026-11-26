'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMenuItem } from '@postmill-ai/frontend/components/layout/top.menu';
import { useUser } from '@postmill-ai/frontend/components/layout/user.context';
import { usePermissions } from '@postmill-ai/frontend/components/layout/use-permissions';
import { useVariables } from '@postmill-ai/react/helpers/variable.context';
import { visibleSettingsNav } from '@postmill-ai/frontend/components/settings/settings-nav.config';
import { useT } from '@postmill-ai/react/translation/get.transation.service.client';

export function QuickJump() {
  const t = useT();
  const router = useRouter();
  const user = useUser();
  const permissions = usePermissions();
  const { isGeneral, billingEnabled } = useVariables();
  const { all } = useMenuItem();
  const destinations = [
    ...all.filter((item) => !item.hide && (!item.requireBilling || billingEnabled) && !item.onClick).map((item) => ({ label: item.name, href: item.path })),
    ...(permissions.isResolved && permissions.hasPermission('settings', 'read')
      ? visibleSettingsNav({ user, permissions, isGeneral, billingEnabled, showLogout: true }, t).map((item) => ({ label: t(item.labelKey, item.labelDefault), href: item.href }))
      : []),
  ];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(
    () => destinations.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
    else setQuery('');
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mobile:hidden flex items-center gap-[10px] w-[440px] max-w-[40vw] h-[38px] px-[14px] rounded-[8px] bg-newBgColor border border-transparent text-newTableText text-[13px] hover:border-newTableBorder transition-colors"
        aria-label={t('quick_jump', 'Quick jump')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <span className="flex-1 text-start">{t('quick_jump_pages', 'Quick jump · Pages and settings')}</span><kbd className="text-[11px]">⌘K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-300 flex justify-center items-start pt-[14vh] bg-newBackdrop/70" onMouseDown={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label={t('quick_jump', 'Quick jump')} className="w-[520px] max-w-[calc(100vw-32px)] bg-newBgColorInner border border-newTableBorder rounded-[12px] shadow-menu overflow-hidden" onMouseDown={(event) => event.stopPropagation()}>
            <input
              ref={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) {
                  router.push(results[0].href);
                  setOpen(false);
                }
              }}
              placeholder={t('quick_jump_search', 'Search pages and settings…')}
              className="w-full h-[56px] px-[20px] bg-transparent text-textColor border-b border-newTableBorder outline-hidden"
            />
            <div className="max-h-[420px] overflow-y-auto p-[8px]">
              {results.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex justify-between px-[12px] py-[9px] rounded-[6px] text-[13px] text-textColor hover:bg-boxHover">
                  <span>{item.label}</span><span className="text-newTableText">↗</span>
                </Link>
              ))}
              {!results.length && <p className="p-[12px] text-[13px] text-newTableText">{t('no_pages_found', 'No pages found')}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
