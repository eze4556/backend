import admin from 'firebase-admin';
import googleCredentials from '../utils/servidoapp-de2a6-805fd5e279c1.json' assert { type: 'json' };

try {
  admin.initializeApp({
    credential: admin.credential.cert(googleCredentials),
  });
  console.log('Firebase Admin SDK inicializado correctamente');
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error);
}

const firestore1 = admin.firestore()
firestore1.collection('testCollection').add({ test: 'testValue' })
  .then((docRef) => {
    console.log('Documento de prueba creado con ID:', docRef.id);
  })
  .catch((error) => {
    console.error('Error al interactuar con Firestore:', error);
  });


export const firestore = admin.firestore();
