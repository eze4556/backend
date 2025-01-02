import admin from 'firebase-admin';
import googleCredentials from '../utils/pencuentro-8fdb3-2eb07c243f60.json' assert { type: 'json' };

try {
  admin.initializeApp({
    credential: admin.credential.cert(googleCredentials),
  });
  console.log('Firebase Admin SDK inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
}

export const firestore = admin.firestore();
