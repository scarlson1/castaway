import { describe, expect, it } from 'vitest';
import { processApiResponse } from '../podcastIndexApi';

describe('processApiResponse', () => {
  it('returns the response body on success', () => {
    const result = processApiResponse<{ feeds: string[] }>({
      statusCode: 200,
      body: { feeds: ['podcast-a', 'podcast-b'] },
    });
    expect(result).toEqual({ feeds: ['podcast-a', 'podcast-b'] });
  });

  it('throws with server description when status is "false" and description is present', () => {
    expect(() =>
      processApiResponse({
        statusCode: 200,
        body: { status: 'false', description: 'Invalid API key' },
      })
    ).toThrow();

    try {
      processApiResponse({
        statusCode: 200,
        body: { status: 'false', description: 'Invalid API key' },
      });
    } catch (err: unknown) {
      expect((err as { message: string }).message).toBe('Invalid API key');
      expect((err as { code: number }).code).toBe(200);
    }
  });

  it('throws with generic message when status is "false" but no description', () => {
    try {
      processApiResponse({
        statusCode: 200,
        body: { status: 'false' },
      });
    } catch (err: unknown) {
      expect((err as { message: string }).message).toBe('Request failed.');
      expect((err as { code: number }).code).toBe(200);
    }
  });

  it('throws on 500 status code regardless of body status field', () => {
    try {
      processApiResponse({
        statusCode: 500,
        body: { status: 'true', description: 'Internal server error' },
      });
    } catch (err: unknown) {
      expect((err as { code: number }).code).toBe(500);
    }
  });

  it('throws with description on 500 when description is present', () => {
    try {
      processApiResponse({
        statusCode: 500,
        body: { description: 'Something went wrong' },
      });
    } catch (err: unknown) {
      expect((err as { message: string }).message).toBe('Something went wrong');
      expect((err as { code: number }).code).toBe(500);
    }
  });

  it('does not throw when body has status field that is not "false"', () => {
    const result = processApiResponse<{ status: string; count: number }>({
      statusCode: 200,
      body: { status: 'true', count: 42 },
    });
    expect(result).toEqual({ status: 'true', count: 42 });
  });

  it('handles non-object body on success', () => {
    const result = processApiResponse<string>({
      statusCode: 200,
      body: 'plain text response',
    });
    expect(result).toBe('plain text response');
  });

  it('handles null body on success', () => {
    const result = processApiResponse<null>({
      statusCode: 200,
      body: null,
    });
    expect(result).toBeNull();
  });
});
