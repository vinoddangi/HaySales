import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Google Drive Folder ID
const FOLDER_ID = '1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e';

// Read Service Account credentials securely from script/service-account.json
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Authenticate Google Drive & Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

/**
 * List all files and subfolders inside the Google Drive folder
 */
export async function listFilesInFolder(folderId = FOLDER_ID) {
  const drive = google.drive({ version: 'v3', auth });

  console.log(`📂 Scanning Google Drive folder: ${folderId}...`);
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink)',
    orderBy: 'name',
  });

  const files = response.data.files || [];
  return files;
}

/**
 * Read the content / sheets data of a specific spreadsheet inside the folder
 */
export async function readSpreadsheetData(
  spreadsheetId,
  range = 'Sheet1!A1:Z',
) {
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

async function main() {
  try {
    const files = await listFilesInFolder(FOLDER_ID);
    console.log(`\n✅ Found ${files.length} file(s) in folder:\n`);

    files.forEach((file, index) => {
      console.log(
        `  ${index + 1}. [${file.mimeType.split('.').pop()}] ${file.name} (ID: ${file.id})`,
      );
    });

    if (files.length === 0) {
      console.log(
        '\n⚠️ No files found or folder is empty. Ensure the folder is shared with:',
      );
      console.log(`   ${serviceAccount.client_email}`);
    }
  } catch (error) {
    console.error('❌ Failed to read Google Drive folder:', error.message);
    console.log('\n💡 Tip: Please ensure:');
    console.log(`1. The folder is shared with: ${serviceAccount.client_email}`);
    console.log(
      '2. Google Drive API is enabled in Google Cloud Console: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=shreyansh-group',
    );
  }
}

// Run when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
