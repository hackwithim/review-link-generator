import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'nosql_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let mongoClient = null;
let mongoDb = null;
let isUsingMongo = false;

// Initialize connection
export async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB Atlas / NoSQL Cluster...');
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      mongoDb = mongoClient.db(process.env.MONGODB_DB_NAME || 'reviewflow');
      isUsingMongo = true;
      console.log('✓ Successfully connected to MongoDB cloud database.');
      await seedDatabaseIfEmpty();
      return;
    } catch (err) {
      console.warn('⚠️ MongoDB connection failed. Falling back to local NoSQL JSON document store.', err.message);
      isUsingMongo = false;
    }
  }

  console.log('Using resilient local NoSQL Document Store (zero setup required).');
  initLocalStore();
  await seedDatabaseIfEmpty();
}

// Local store memory & disk sync
let localData = {
  accounts: [],
  reviews: [],
  submissions: [],
  links: []
};

function initLocalStore() {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      localData = JSON.parse(raw);
    } catch (e) {
      console.error('Failed reading local DB file, initializing fresh store', e);
    }
  } else {
    persistLocalStore();
  }
}

function persistLocalStore() {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localData, null, 2), 'utf-8');
}

// Seed with sheet data if collections are empty
async function seedDatabaseIfEmpty() {
  const seedAccountsPath = path.join(__dirname, '..', '..', 'src', 'data', 'accounts.json');
  const seedReviewsPath = path.join(__dirname, '..', '..', 'src', 'data', 'reviews.json');

  let defaultAccounts = [];
  let defaultReviews = [];

  if (fs.existsSync(seedAccountsPath)) {
    defaultAccounts = JSON.parse(fs.readFileSync(seedAccountsPath, 'utf-8'));
  }
  if (fs.existsSync(seedReviewsPath)) {
    defaultReviews = JSON.parse(fs.readFileSync(seedReviewsPath, 'utf-8'));
  }

  if (isUsingMongo && mongoDb) {
    const accCount = await mongoDb.collection('accounts').countDocuments();
    if (accCount === 0 && defaultAccounts.length > 0) {
      await mongoDb.collection('accounts').insertMany(defaultAccounts);
      console.log(`Seeded ${defaultAccounts.length} accounts to MongoDB.`);
    }

    const revCount = await mongoDb.collection('reviews').countDocuments();
    if (revCount === 0 && defaultReviews.length > 0) {
      await mongoDb.collection('reviews').insertMany(defaultReviews);
      console.log(`Seeded ${defaultReviews.length} reviews to MongoDB.`);
    }
  } else {
    if (!localData.accounts || localData.accounts.length === 0) {
      localData.accounts = defaultAccounts;
    }
    if (!localData.reviews || localData.reviews.length === 0) {
      localData.reviews = defaultReviews;
    }
    persistLocalStore();
  }
}

// Unified NoSQL Data Access Layer (CRUD)
export const db = {
  async find(collectionName, filter = {}) {
    if (isUsingMongo && mongoDb) {
      return await mongoDb.collection(collectionName).find(filter).toArray();
    }
    const items = localData[collectionName] || [];
    return items.filter(doc => matchesFilter(doc, filter));
  },

  async findOne(collectionName, filter = {}) {
    if (isUsingMongo && mongoDb) {
      return await mongoDb.collection(collectionName).findOne(filter);
    }
    const items = localData[collectionName] || [];
    return items.find(doc => matchesFilter(doc, filter)) || null;
  },

  async insertOne(collectionName, doc) {
    const item = { ...doc, createdAt: new Date() };
    if (isUsingMongo && mongoDb) {
      const res = await mongoDb.collection(collectionName).insertOne(item);
      return { ...item, _id: res.insertedId };
    }
    if (!localData[collectionName]) localData[collectionName] = [];
    localData[collectionName].push(item);
    persistLocalStore();
    return item;
  },

  async updateOne(collectionName, filter, update) {
    if (isUsingMongo && mongoDb) {
      return await mongoDb.collection(collectionName).updateOne(filter, update);
    }
    const items = localData[collectionName] || [];
    const idx = items.findIndex(doc => matchesFilter(doc, filter));
    if (idx !== -1) {
      const target = items[idx];
      const updates = update.$set || update;
      items[idx] = { ...target, ...updates, updatedAt: new Date() };
      persistLocalStore();
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  },

  async updateMany(collectionName, filter, update) {
    if (isUsingMongo && mongoDb) {
      return await mongoDb.collection(collectionName).updateMany(filter, update);
    }
    const items = localData[collectionName] || [];
    let count = 0;
    const updates = update.$set || update;
    items.forEach((doc, idx) => {
      if (matchesFilter(doc, filter)) {
        items[idx] = { ...doc, ...updates, updatedAt: new Date() };
        count++;
      }
    });
    if (count > 0) persistLocalStore();
    return { modifiedCount: count };
  },

  async count(collectionName, filter = {}) {
    if (isUsingMongo && mongoDb) {
      return await mongoDb.collection(collectionName).countDocuments(filter);
    }
    const items = localData[collectionName] || [];
    return items.filter(doc => matchesFilter(doc, filter)).length;
  },

  getDbStatus() {
    return {
      type: isUsingMongo ? 'MongoDB Cloud / Atlas' : 'Local Document Store (NoSQL JSON)',
      isMongoConnected: isUsingMongo,
      collections: {
        accounts: isUsingMongo ? 'active' : localData.accounts.length,
        reviews: isUsingMongo ? 'active' : localData.reviews.length,
        submissions: isUsingMongo ? 'active' : localData.submissions.length,
      }
    };
  }
};

function matchesFilter(doc, filter) {
  for (const key of Object.keys(filter)) {
    if (filter[key] !== undefined && doc[key] !== filter[key]) {
      return false;
    }
  }
  return true;
}
