import { type APIRequestContext, type APIResponse } from '@playwright/test';

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  async get(path: string): Promise<APIResponse> {
    return this.request.get(this.url(path));
  }

  async post<TBody extends Record<string, unknown>>(path: string, body: TBody): Promise<APIResponse> {
    return this.request.post(this.url(path), { data: body });
  }

  private url(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl.replace(/\/$/, '')}${normalizedPath}`;
  }
}

