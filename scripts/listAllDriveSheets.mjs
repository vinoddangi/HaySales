import fs from 'fs';
import crypto from 'crypto';

async function getAccessToken() {
  const creds = JSON.parse(fs.readFileSync('scripts/service-account.json', 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const jwt = `${unsigned}.${sign.sign(creds.private_key, 'base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

async function listAll() {
  const token = await getAccessToken();
  let pageToken = null;
  const allFiles = [];
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('fields', 'nextPageToken, files(id, name, mimeType, modifiedTime, createdTime, owners)');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.files) {
      allFiles.push(...data.files);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`\n======================================================`);
  console.log(`📁 TOTAL GOOGLE DRIVE FILES ACCESSIBLE: ${allFiles.length}`);
  console.log(`======================================================`);
  allFiles.sort((a, b) => a.name.localeCompare(b.name));
  allFiles.forEach((f, i) => {
    console.log(`${i + 1}. [${f.id}] "${f.name}" (MIME: ${f.mimeType}, Modified: ${f.modifiedTime})`);
  });

  fs.writeFileSync('backups/driveFilesList.json', JSON.stringify(allFiles, null, 2), 'utf8');
}

listAll().catch(console.error);
