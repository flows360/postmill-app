import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@postmill-ai/react/translation/get.transation.service.client', () => ({
  useT: () => (_key: string, fallback: string) => fallback,
}));

vi.mock('@postmill-ai/frontend/components/analytics/kit/channel-avatar', () => ({
  ChannelAvatar: (p: { name?: string }) => <span data-testid="avatar">{p.name}</span>,
}));

vi.mock('@postmill-ai/frontend/components/analytics/kit/states', () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty">{title}</div>,
}));

const mockList = vi.fn();
vi.mock('@postmill-ai/frontend/components/launches/helpers/use.integration.list', () => ({
  useIntegrationList: () => mockList(),
}));

import { ChannelsWidget } from './channels.widget';

describe('ChannelsWidget', () => {
  beforeEach(() => mockList.mockReset());

  it('shows an empty state when no channel is connected', () => {
    mockList.mockReturnValue({ data: [] });
    render(<ChannelsWidget />);
    expect(screen.getByTestId('empty').textContent).toBe('No channels yet');
  });

  it('lists channels with their status, the ones that need you first', () => {
    mockList.mockReturnValue({
      data: [
        { id: '1', name: 'Blog', identifier: 'wordpress' },
        { id: '2', name: 'Company Page', identifier: 'linkedin-page', refreshNeeded: true },
        { id: '3', name: 'Old', identifier: 'x', disabled: true },
      ],
    });
    render(<ChannelsWidget />);
    const rows = screen.getAllByTestId('channel-row');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Company Page');
    expect(rows[0].textContent).toContain('Reconnect');
    expect(rows[1].textContent).toContain('Connected');
    expect(rows[2].textContent).toContain('Disabled');
    expect(rows[0].getAttribute('href')).toBe('/settings/channels');
  });
});
