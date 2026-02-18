import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Import after mocking
const { api } = await import('../lib/api-client');

beforeEach(() => {
  fetchMock.mockReset();
});

function mockResponse(status: number, data: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

describe('api-client', () => {
  it('login sends POST with credentials', async () => {
    mockResponse(200, { ok: true, data: { user: { id: 'u1' }, token: 'tok' } });

    const result = await api.login('a@b.com', 'password');

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/auth/login');
    expect(opts.method).toBe('POST');
    expect(opts.credentials).toBe('include');
    expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.com', password: 'password' });
    expect(result.ok).toBe(true);
  });

  it('login returns error on 401', async () => {
    mockResponse(401, { ok: false, error: 'Invalid credentials' });

    const result = await api.login('a@b.com', 'wrong');

    expect(result.ok).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });

  it('listWorkspaces sends GET with credentials', async () => {
    mockResponse(200, { ok: true, data: [{ id: 'w1', name: 'Test' }] });

    const result = await api.listWorkspaces();

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/workspaces');
    expect(opts.method).toBe('GET');
    expect(opts.credentials).toBe('include');
    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('createRecord sends POST with data', async () => {
    mockResponse(200, { ok: true, data: { id: 'r1' } });

    const result = await api.createRecord('t1', { name: 'Test' });

    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/tables/t1/records');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ data: { name: 'Test' } });
    expect(result.ok).toBe(true);
  });

  it('deleteRecord sends DELETE', async () => {
    mockResponse(200, { ok: true, data: null });

    await api.deleteRecord('t1', 'r1');

    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/tables/t1/records/r1');
    expect(opts.method).toBe('DELETE');
  });

  it('getMe sends GET to /api/auth/me', async () => {
    mockResponse(200, { ok: true, data: { user: { id: 'u1', email: 'a@b.com' } } });

    const result = await api.getMe();
    expect(result.ok).toBe(true);

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/auth/me');
  });

  it('fallback error when response has no error field', async () => {
    mockResponse(500, { ok: false });

    const result = await api.login('a@b.com', 'pass');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('HTTP 500');
  });
});
