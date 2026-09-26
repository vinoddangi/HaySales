import {
  clearAllLocalData,
  getPendingChangesCount,
  syncAndPublishCloudDatabase,
  syncLocalDatabaseFromCloud,
} from '../services/indexedDBService';

export async function syncDatabaseWithCloud() {
  return syncAndPublishCloudDatabase();
}

export async function pullDatabaseFromCloud() {
  return syncLocalDatabaseFromCloud();
}

export async function resetLocalDatabase() {
  await clearAllLocalData();
  return syncLocalDatabaseFromCloud();
}

export { getPendingChangesCount };
