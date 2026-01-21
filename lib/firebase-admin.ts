/**
 * Firebase Admin SDK initialization for server-side operations
 * Used in API routes for secure database access
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getFirestore, Firestore } from "firebase-admin/firestore"

let app: App | undefined
let db: Firestore | undefined

function getFirebaseAdmin() {
  if (!app) {
    const apps = getApps()

    if (apps.length === 0) {
      // Initialize with service account from file
      // In production, use environment variables instead
      const serviceAccount = require("../serviceAccountKey.json")

      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      })
    } else {
      app = apps[0]
    }
  }

  if (!db) {
    db = getFirestore(app)
  }

  return { app, db }
}

export function getAdminFirestore(): Firestore {
  return getFirebaseAdmin().db
}

export { getFirebaseAdmin }
