import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Commented out connection test to prevent blocking
// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, '_connection_test', 'ping'));
//     console.log('Firestore connection successful');
//   } catch (error: any) {
//     if (error.message?.includes('the client is offline')) {
//       console.error('Firebase configuration error: The client is offline. Please check your API key and project settings.');
//     } else if (error.code === 'invalid-argument' || error.message?.includes('invalid-api-key')) {
//       console.error('Firebase: Invalid API Key. Please check your firebase-applet-config.json');
//     } else if (error.message?.includes('Service firestore is not available')) {
//       console.error('Firebase: Firestore service is not available. Please ensure it is provisioned in the Firebase console.');
//     }
//   }
// }

// testConnection();
