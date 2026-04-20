import { AxiosError } from 'axios';

export interface ParsedApiError {
  status: number;
  message: string;
  errors: unknown;
}

const FALLBACK_MESSAGE = 'An unexpected error occurred.';

const extractMessageFromData = (data: unknown): string | null => {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;
    const detail = dataObj.detail;
    const error = dataObj.error;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    for (const value of Object.values(dataObj)) {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0] as string;
      }
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return null;
};

export const parseApiError = (error: unknown): ParsedApiError => {
  const axiosError = error as AxiosError;

  if (axiosError?.response) {
    const message = extractMessageFromData(axiosError.response.data) || FALLBACK_MESSAGE;
    return {
      status: axiosError.response.status,
      message,
      errors: (axiosError.response.data as any)?.errors || null,
    };
  }

  if (axiosError?.request) {
    return {
      status: 0,
      message: 'Network error - unable to connect to server.',
      errors: null,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message || FALLBACK_MESSAGE,
      errors: null,
    };
  }

  return {
    status: 0,
    message: FALLBACK_MESSAGE,
    errors: null,
  };
};

export const getUserFriendlyErrorMessage = (error: unknown, fallback?: string): string => {
  const parsed = parseApiError(error);
  return parsed.message || fallback || FALLBACK_MESSAGE;
};
