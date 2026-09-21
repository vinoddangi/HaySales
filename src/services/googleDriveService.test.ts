import { describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_DRIVE_FOLDER_ID,
  GOOGLE_DRIVE_FOLDER_URL,
  uploadCsvToGoogleDrive,
} from './googleDriveService';

describe('googleDriveService', () => {
  it('has correct Google Drive target folder configuration', () => {
    expect(GOOGLE_DRIVE_FOLDER_ID).toBe('1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e');
    expect(GOOGLE_DRIVE_FOLDER_URL).toContain(
      '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e',
    );
  });

  it('uploads CSV with multipart body to Google Drive endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'drive_file_123',
        name: 'sales.csv',
        mimeType: 'text/csv',
      }),
    });
    globalThis.fetch = mockFetch;

    const result = await uploadCsvToGoogleDrive(
      'sales.csv',
      'id,item,amount\n1,hay,100',
      GOOGLE_DRIVE_FOLDER_ID,
      'mock_token_123',
    );

    expect(result.id).toBe('drive_file_123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('uploadType=multipart'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock_token_123',
        }),
      }),
    );
  });
});
