import largeAssets from './large-assets';
import {buildId} from './build-id';
import Database from './idb';

// We can't trust the HTTP cache to reliably cache these large assets

const DATABASE_NAME = 'p4-large-assets';
const DATABASE_VERSION = 1;
const STORE_NAME = 'assets';

const db = new Database(DATABASE_NAME, DATABASE_VERSION, STORE_NAME);

const getAssetId = (asset) => {
  return `${asset.src}-${asset.type}-${asset.sha256 || buildId}`;
};

const removeExtraneous = async () => {
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const allValidAssetIds = Object.values(largeAssets).map(getAssetId);
    const request = store.openCursor();
    request.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        const key = cursor.key;
        if (!allValidAssetIds.includes(key)) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
};
db.onopen = removeExtraneous;

const get = async (asset) => {
  const {transaction, store} = await db.createTransaction('readonly');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const assetId = getAssetId(asset);
    const request = store.get(assetId);
    request.onsuccess = (e) => {
      const result = e.target.result;
      if (result) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
  });
};

const set = async (asset, content) => {
  const {transaction, store} = await db.createTransaction('readwrite');
  return new Promise((resolve, reject) => {
    Database.setTransactionErrorHandler(transaction, reject);
    const assetId = getAssetId(asset);
    const request = store.put({
      id: assetId,
      data: content
    });
    request.onsuccess = () => {
      resolve();
    };
  });
};

const resetAll = () => db.deleteEverything();

export default {
  get,
  set,
  resetAll
};
