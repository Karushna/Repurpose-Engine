import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let firestore: ReturnType<typeof getFirestore> | null = null;

export function getDb() {
  if (firestore) {
    return firestore;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      : getApps()[0];

  firestore = getFirestore(app);
  return firestore;
}
