import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../store/firebaseConfig';

export const GOOGLE_DRIVE_FOLDER_ID = '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e';
export const GOOGLE_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${GOOGLE_DRIVE_FOLDER_ID}`;

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

let cachedAccessToken: string | null = null;

/**
 * Gets or requests an OAuth access token with Google Drive scope on-demand via popup.
 */
export async function getGoogleDriveAccessToken(
  forcePrompt = false,
): Promise<string> {
  if (cachedAccessToken && !forcePrompt) {
    return cachedAccessToken;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.setCustomParameters({
    prompt: 'consent',
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error(
      'Google Drive authorization failed: No access token received.',
    );
  }

  cachedAccessToken = credential.accessToken;
  return cachedAccessToken;
}

export interface DriveUploadedFile {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

/**
 * Uploads a CSV file directly to a Google Drive folder via Drive API v3 multipart upload.
 */
export async function uploadCsvToGoogleDrive(
  fileName: string,
  csvContent: string,
  folderId = GOOGLE_DRIVE_FOLDER_ID,
  accessToken?: string,
): Promise<DriveUploadedFile> {
  const token = accessToken || (await getGoogleDriveAccessToken());

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'text/csv',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    // If token expired, clear cache
    if (response.status === 401) {
      cachedAccessToken = null;
    }
    throw new Error(
      `Failed to upload ${fileName} to Google Drive (${response.status}): ${errorText}`,
    );
  }

  return (await response.json()) as DriveUploadedFile;
}

/**
 * Lists CSV backup files in the Google Drive folder.
 */
export async function listGoogleDriveBackupFiles(
  folderId = GOOGLE_DRIVE_FOLDER_ID,
  accessToken?: string,
): Promise<DriveFileItem[]> {
  const token = accessToken || (await getGoogleDriveAccessToken());

  const query = encodeURIComponent(
    `'${folderId}' in parents and trashed = false and mimeType = 'text/csv'`,
  );
  const fields = encodeURIComponent(
    'files(id, name, mimeType, createdTime, modifiedTime, size)',
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=${fields}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) cachedAccessToken = null;
    const errorText = await response.text();
    throw new Error(`Failed to list Google Drive files: ${errorText}`);
  }

  const data = await response.json();
  return (data.files || []) as DriveFileItem[];
}

/**
 * Downloads a file's text content from Google Drive by file ID.
 */
export async function downloadGoogleDriveFileContent(
  fileId: string,
  accessToken?: string,
): Promise<string> {
  const token = accessToken || (await getGoogleDriveAccessToken());

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) cachedAccessToken = null;
    throw new Error(
      `Failed to download Google Drive file: ${response.statusText}`,
    );
  }

  return await response.text();
}
