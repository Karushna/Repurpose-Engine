import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let firebaseApp: ReturnType<typeof initializeApp> | null = null;
let firestore: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp =
    getApps().length === 0
      ? initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      : getApps()[0];

  return firebaseApp;
}

export function getDb() {
  if (firestore) {
    return firestore;
  }

  firestore = getFirestore(getFirebaseAdminApp());
  return firestore;
}

export function getAdminAuth() {
  if (auth) {
    return auth;
  }

  auth = getAuth(getFirebaseAdminApp());
  return auth;
}
