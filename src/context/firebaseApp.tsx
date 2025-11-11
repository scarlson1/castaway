export {};

// import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
// import { getApps, initializeApp, registerVersion } from 'firebase/app';
// import type { ReactNode } from 'react';
// import { createContext, useContext, useMemo, version } from 'react';

// // source ref: https://github.com/FirebaseExtended/reactfire/blob/main/src/firebaseApp.tsx

// const DEFAULT_APP_NAME = '[DEFAULT]';

// const FirebaseAppContext = createContext<FirebaseApp | undefined>(undefined);

// // const shallowEq = (a: { [key: string]: any }, b: { [key: string]: any }) =>
// //   a === b ||
// //   [...Object.keys(a), ...Object.keys(b)].every((key) => a[key] === b[key]);
// const shallowEq = (a: FirebaseOptions, b: FirebaseOptions) =>
//   a === b ||
//   (Object.keys({ ...a, ...b }) as Array<keyof FirebaseOptions>).every(
//     (key) => a[key] === b[key]
//   );

// interface FirebaseAppProviderProps {
//   firebaseApp?: FirebaseApp;
//   firebaseConfig?: FirebaseOptions;
//   appName?: string;
//   children?: ReactNode;
// }

// export function FirebaseAppProvider(props: FirebaseAppProviderProps) {
//   const { firebaseConfig, appName, children } = props;

//   const firebaseApp: FirebaseApp = useMemo(() => {
//     if (props.firebaseApp) return props.firebaseApp;

//     const existingApp = getApps().find(
//       (app) => app.name === (appName || DEFAULT_APP_NAME)
//     );
//     if (existingApp) {
//       if (firebaseConfig && shallowEq(existingApp.options, firebaseConfig)) {
//         return existingApp;
//       } else {
//         throw new Error(
//           `Does not match the options already provided to the ${
//             appName || 'default'
//           } firebase app instance, give this new instance a different appName.`
//         );
//       }
//     } else {
//       if (!firebaseConfig) throw new Error('No firebaseConfig provided');

//       const reactVersion = version || 'unknown';
//       registerVersion('react', reactVersion);
//       return initializeApp(firebaseConfig, appName);
//     }
//   }, [props.firebaseApp, firebaseConfig, appName]);

//   return (
//     <FirebaseAppContext.Provider value={firebaseApp}>
//       {children}
//     </FirebaseAppContext.Provider>
//   );
// }

// export function useFirebaseApp() {
//   const firebaseApp = useContext(FirebaseAppContext);
//   if (!firebaseApp)
//     throw new Error(
//       'useFirebaseApp must be used within a child of FirebaseAppProvider'
//     );

//   return firebaseApp;
// }
