import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function manageUsers() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'list') {
    const listUsersResult = await auth.listUsers(100);
    console.log('\n📋 Firebase Auth Users:');
    listUsersResult.users.forEach((userRecord) => {
      console.log(
        `- UID: ${userRecord.uid} | Phone: ${userRecord.phoneNumber || 'N/A'} | Display Name: "${userRecord.displayName || 'None'}"`,
      );
    });
    return;
  }

  if (command === 'set-name') {
    const phoneOrUid = args[1];
    const newName = args.slice(2).join(' ');

    if (!phoneOrUid || !newName) {
      console.log(
        'Usage: node script/manageUser.js set-name <phoneNumber-or-uid> <DisplayName>',
      );
      return;
    }

    let uid = phoneOrUid;
    if (phoneOrUid.startsWith('+')) {
      const user = await auth.getUserByPhoneNumber(phoneOrUid);
      uid = user.uid;
    } else if (phoneOrUid.length === 10 && !isNaN(Number(phoneOrUid))) {
      // Default to India +91 if 10 digit number provided
      const user = await auth.getUserByPhoneNumber(`+91${phoneOrUid}`);
      uid = user.uid;
    }

    await auth.updateUser(uid, { displayName: newName });
    console.log(
      `✅ Successfully updated displayName for ${phoneOrUid} to "${newName}"!`,
    );
    return;
  }

  console.log('Commands:');
  console.log('  node script/manageUser.js list');
  console.log('  node script/manageUser.js set-name +919876543210 "Your Name"');
  console.log('  node script/manageUser.js set-name 9876543210 "Your Name"');
}

manageUsers().catch(console.error);
