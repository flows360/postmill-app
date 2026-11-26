import { render, screen, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockIsGeneral = true;
let mockBillingEnabled = false;
let mockPathname = '/dashboard';

vi.mock('@postmill-ai/react/helpers/variable.context', () => ({
  useVariables: () => ({ isGeneral: mockIsGeneral, billingEnabled: mockBillingEnabled }),
}));

const mockT = vi.fn((_key: string, fallback?: string) => fallback ?? _key);

vi.mock('@postmill-ai/react/translation/get.transation.service.client', () => ({
  useT: () => mockT,
}));

vi.mock('@postmill-ai/frontend/components/layout/user.context', () => ({
  useUser: () => ({
    id: 'test-user',
    orgId: 'test-org',
    role: 'USER',
    tier: 'PRO',
  }),
  ContextWrapper: ({ children }: any) => children,
}));

vi.mock('@postmill-ai/frontend/components/layout/new-modal', () => ({
  useModals: () => ({ openModal: vi.fn() }),
  ModalWrapper: ({ children }: any) => children,
}));

vi.mock('@postmill-ai/frontend/components/layout/agent.media.modal', () => ({
  AgentMediaModal: () => null,
}));

let mockDisplay: string | null = null;
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname || '/dashboard',
  useSearchParams: () => new URLSearchParams(mockDisplay ? `display=${mockDisplay}` : ''),
}));

let mockPermissions = {
  isLoaded: true,
  isResolved: true,
  role: 'owner' as string | null,
  isSuperAdmin: false,
  isOwner: true,
  isAdmin: true,
  hasPermission: (_resource: string, _action: string) => true,
  refresh: vi.fn(),
};

vi.mock('@postmill-ai/frontend/components/layout/use-permissions', () => ({
  usePermissions: () => mockPermissions,
}));

import { TopMenu, useMenuItem } from './top.menu';

describe('TopMenu', () => {
  describe('Calendar and Posts views of /posts', () => {
    beforeEach(() => {
      mockBillingEnabled = false;
      mockDisplay = null;
    });

    it('in general mode shows Calendar and Posts as two views of /posts', () => {
      mockIsGeneral = true;
      render(<TopMenu />);
      expect(screen.getByTitle('Calendar').getAttribute('href')).toBe('/posts?display=week');
      expect(screen.getByTitle('Posts').getAttribute('href')).toBe('/posts?display=list');
    });

    it('in non-general mode, the calendar label should be "Launches"', () => {
      mockIsGeneral = false;
      render(<TopMenu />);
      expect(screen.getByTitle('Launches')).toBeDefined();
    });

    it('lights Posts only for the list view and Calendar otherwise', () => {
      mockIsGeneral = true;
      mockPathname = '/posts';
      mockDisplay = 'list';
      const { unmount } = render(<TopMenu />);
      expect(screen.getByTitle('Posts').className).toContain('bg-boxFocused');
      expect(screen.getByTitle('Calendar').className).not.toContain('bg-boxFocused');
      unmount();
      mockDisplay = 'month';
      render(<TopMenu />);
      expect(screen.getByTitle('Calendar').className).toContain('bg-boxFocused');
      expect(screen.getByTitle('Posts').className).not.toContain('bg-boxFocused');
    });
  });

  describe('R5 settings gating', () => {
    beforeEach(() => {
      mockIsGeneral = true;
      mockBillingEnabled = false;
      mockPermissions = {
        isLoaded: true,
        isResolved: true,
        role: 'owner',
        isSuperAdmin: false,
        isOwner: true,
        isAdmin: true,
        hasPermission: () => true,
        refresh: vi.fn(),
      };
    });

    it('shows Settings for members with settings:read', () => {
      render(<TopMenu />);
      expect(screen.getByTitle('Settings')).toBeDefined();
    });

    it('hides Settings for members lacking settings:read', () => {
      mockPermissions.hasPermission = () => false;
      mockPermissions.isOwner = false;
      mockPermissions.isAdmin = false;
      mockPermissions.role = 'viewer';
      render(<TopMenu />);
      expect(screen.queryByTitle('Settings')).toBeNull();
    });

    it('shows Settings optimistically while permissions load (no flash)', () => {
      mockPermissions.isResolved = false;
      mockPermissions.isLoaded = false;
      mockPermissions.hasPermission = () => false;
      render(<TopMenu />);
      expect(screen.getByTitle('Settings')).toBeDefined();
    });
  });

  describe('Overview navigation', () => {
    beforeEach(() => {
      mockIsGeneral = true;
      mockBillingEnabled = false;
      mockPathname = '/dashboard';
      mockDisplay = null;
    });

    it('pins Overview first in firstMenu', () => {
      const { result } = renderHook(() => useMenuItem());
      expect(result.current.firstMenu[0].path).toBe('/dashboard');
      expect(result.current.firstMenu[0].name).toBe('Overview');
    });

    it('keeps the design order', () => {
      const { result } = renderHook(() => useMenuItem());
      expect(result.current.firstMenu.map((i) => i.name)).toEqual([
        'Overview', 'Calendar', 'Posts', 'Campaigns', 'Library', 'Create', 'Analytics', 'Inbox', 'Agent',
      ]);
    });

    it('highlights Overview as active on /dashboard', () => {
      render(<TopMenu />);
      expect(screen.getByTitle('Overview').className).toContain('bg-boxFocused');
    });
  });
});
