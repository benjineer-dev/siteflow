const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api';

interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: unknown;
  token?: string | null;
}

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  let requestBody: BodyInit | undefined;

  if (options.body instanceof FormData) {
    requestBody = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestBody = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set(
      'Authorization',
      `Bearer ${options.token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
      body: requestBody,
      cache: 'no-store',
    },
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType =
    response.headers.get('content-type');

  const responseBody = contentType?.includes(
    'application/json',
  )
    ? ((await response.json()) as ApiErrorResponse)
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(responseBody),
      response.status,
    );
  }

  return responseBody as T;
}

function getErrorMessage(
  responseBody: ApiErrorResponse | string,
): string {
  if (typeof responseBody === 'string') {
    return (
      responseBody.trim() ||
      'An unexpected error occurred'
    );
  }

  if (Array.isArray(responseBody.message)) {
    return responseBody.message.join('. ');
  }

  if (
    typeof responseBody.message === 'string'
  ) {
    return responseBody.message;
  }

  return (
    responseBody.error ??
    'An unexpected error occurred'
  );
}
export async function apiDownload(
  path: string,
  token: string,
): Promise<Blob> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const contentType =
      response.headers.get('content-type');

    const responseBody = contentType?.includes(
      'application/json',
    )
      ? ((await response.json()) as ApiErrorResponse)
      : await response.text();

    throw new ApiError(
      getErrorMessage(responseBody),
      response.status,
    );
  }

  return response.blob();
}