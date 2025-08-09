import { MongoClient, Db } from "mongodb";

let uri: string | undefined = process.env.MONGODB_URI as string | undefined;
let dbName: string | undefined = process.env.MONGODB_DB as string | undefined;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
const clientPromise: Promise<MongoClient> = (async () => {
  if (!global._mongoClientPromise) {
    if (!uri) uri = process.env.MONGODB_URI as string | undefined;
    client = new MongoClient(uri ?? "", { maxPoolSize: 10 });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise!;
})();

export async function getDb(): Promise<Db> {
  if (!dbName) dbName = process.env.MONGODB_DB as string | undefined;
  if (!dbName)
    throw new Error("MONGODB_DB is not defined in environment variables");
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
