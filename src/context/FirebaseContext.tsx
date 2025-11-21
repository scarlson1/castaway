export {};

// import { connectAuthEmulator, getAuth } from 'firebase/auth';
// import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
// import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
// import { connectStorageEmulator, getStorage } from 'firebase/storage';
// import { useEffect, type ReactNode } from 'react';
// import { FirebaseAppProvider, useFirebaseApp } from '~/context/firebaseApp';
// import {
//   AuthProvider,
//   FirestoreProvider,
//   FunctionsProvider,
//   StorageProvider,
// } from '~/context/firebaseSdks';
// import { env } from '~/utils/env.validation';

// const firebaseConfig = {
//   apiKey: env.VITE_FB_API_KEY,
//   authDomain: env.VITE_FB_AUTH_DOMAIN,
//   projectId: env.VITE_FB_PROJECT_ID,
//   storageBucket: env.VITE_FB_STORAGE_BUCKET,
//   messagingSenderId: env.VITE_FB_MSG_SENDER_ID,
//   appId: env.VITE_FB_APP_ID,
// };

// export function FirebaseServicesContext({ children }: { children: ReactNode }) {
//   const app = useFirebaseApp();

//   const auth = getAuth(app);
//   const firestore = getFirestore(app);
//   const functions = getFunctions(app);
//   const storage = getStorage(app);

//   useEffect(() => {
//     if (import.meta.env.VITE_EMULATORS === 'true') {
//       console.log(
//         'USING FIREBASE AUTH, FIRESTORE, FUNCTIONS, STORAGE EMULATORS'
//       );
//       connectAuthEmulator(auth, 'http://localhost:9099', {
//         disableWarnings: true,
//       });
//       connectFirestoreEmulator(firestore, 'localhost', 8080);
//       connectFunctionsEmulator(functions, 'localhost', 5001);
//       connectStorageEmulator(storage, 'localhost', 9199);
//     }
//   }, [auth, firestore, functions]); // storage

//   return (
//     // <AppCheckProvider sdk={appCheck}>
//     <AuthProvider sdk={auth}>
//       <FirestoreProvider sdk={firestore}>
//         <FunctionsProvider sdk={functions}>
//           <StorageProvider sdk={storage}>
//             {/* <RemoteConfigProvider sdk={remoteConfigInstance}> */}
//             {/* <AnalyticsProvider sdk={analytics}> */}
//             {children}
//             {/* </AnalyticsProvider> */}
//             {/* </RemoteConfigProvider> */}
//           </StorageProvider>
//         </FunctionsProvider>
//       </FirestoreProvider>
//     </AuthProvider>
//     // </AppCheckProvider>
//   );
// }

// export function FirebaseAppContext({ children }: { children: ReactNode }) {
//   return (
//     <FirebaseAppProvider firebaseConfig={firebaseConfig}>
//       {children}
//     </FirebaseAppProvider>
//   );
// }
