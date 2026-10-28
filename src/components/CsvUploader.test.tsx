import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CsvUploader } from './CsvUploader';

const { insert, toast } = vi.hoisted(() => ({ insert: vi.fn(), toast: vi.fn() }));
vi.mock('@/hooks/use-pqls', () => ({ useInsertPqls: () => ({ mutateAsync: insert }) }));
vi.mock('@/hooks/use-toast', () => ({ toast }));

async function upload() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><CsvUploader /></QueryClientProvider>);
  const file = new File([
    'Email,Company Name,Usage Score (1-10),Last Active\nalex@northstar.example,Northstar Labs,10,30 minutes ago',
  ], 'sample.csv', { type: 'text/csv' });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByText('alex@northstar.example');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Import & Process PQLs' }));
  });
}

afterEach(() => { cleanup(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

describe('CSV import failures', () => {
  it('keeps the CSV available when saving fails and never calls qualification', async () => {
    insert.mockRejectedValue(new Error('Failed to fetch'));
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await upload();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Import & Process PQLs' })).toBeEnabled());
    expect(screen.getByText('alex@northstar.example')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports an HTTP processing failure after saving instead of silently succeeding', async () => {
    insert.mockResolvedValue([{ id: 'test-id', email: 'alex@northstar.example' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await upload();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'PQLs saved; processing incomplete',
      description: expect.stringContaining('HTTP 500'),
    })));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Import & Process PQLs' })).not.toBeInTheDocument());
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('maps sample headers correctly and reports successful qualification', async () => {
    insert.mockResolvedValue([{ id: 'test-id', email: 'alex@northstar.example' }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ qualified: [{ id: 'test-id' }] }) }));
    await upload();
    await waitFor(() => expect(toast).toHaveBeenCalledWith({ title: '1 PQLs qualified' }));
    expect(insert).toHaveBeenCalledWith([expect.objectContaining({
      email: 'alex@northstar.example', company_name: 'Northstar Labs', product_usage_score: 10,
      last_active_date: null, raw_data: expect.objectContaining({ 'Last Active': '30 minutes ago' }),
    })]);
  });
});
