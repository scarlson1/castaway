export {};

// import type { Analytics } from 'firebase/analytics';
// import type { AppCheck } from 'firebase/app-check';
// import type { Auth } from 'firebase/auth';
// import type { Database } from 'firebase/database';
// import type { Firestore } from 'firebase/firestore';
// import type { Functions } from 'firebase/functions';
// import type { FirebasePerformance } from 'firebase/performance';
// import type { RemoteConfig } from 'firebase/remote-config';
// import type { FirebaseStorage } from 'firebase/storage';
// import type { Context, PropsWithChildren } from 'react';
// import { createContext, useContext } from 'react';
// import { useFirebaseApp } from './firebaseApp';

// export const AppCheckSdkContext = createContext<AppCheck | undefined>(
//   undefined
// );
// export const AuthSdkContext = createContext<Auth | undefined>(undefined);
// export const AnalyticsSdkContext = createContext<Analytics | undefined>(
//   undefined
// );
// export const DatabaseSdkContext = createContext<Database | undefined>(
//   undefined
// );
// export const FirestoreSdkContext = createContext<Firestore | undefined>(
//   undefined
// );
// export const FunctionsSdkContext = createContext<Functions | undefined>(
//   undefined
// );
// export const StorageSdkContext = createContext<FirebaseStorage | undefined>(
//   undefined
// );
// export const PerformanceSdkContext = createContext<
//   FirebasePerformance | undefined
// >(undefined);
// export const RemoteConfigSdkContext = createContext<RemoteConfig | undefined>(
//   undefined
// );

// type FirebaseSdks =
//   | Analytics
//   | AppCheck
//   | Auth
//   | Database
//   | Firestore
//   | FirebasePerformance
//   | FirebaseStorage
//   | Functions
//   | RemoteConfig;

// function getSdkProvider<Sdk extends FirebaseSdks>(
//   SdkContext: Context<Sdk | undefined>
// ) {
//   return function SdkProvider({
//     sdk,
//     ...props
//   }: PropsWithChildren<{ sdk: Sdk }>) {
//     if (!sdk) throw new Error('no sdk provided');

//     const contextualAppName = useFirebaseApp().name;
//     const sdkAppName = sdk?.app?.name;
//     if (sdkAppName !== contextualAppName)
//       throw new Error('sdk was initialize with different firebase app');

//     return <SdkContext.Provider value={sdk} {...props} />;
//   };
// }

// function useSdk<Sdk extends FirebaseSdks>(
//   SdkContext: Context<Sdk | undefined>
// ): Sdk {
//   const sdk = useContext(SdkContext);

//   if (!sdk)
//     throw new Error(
//       'SDK not found. useSdk must be called from within a provider'
//     );

//   return sdk;
// }

// export const AppCheckProvider = getSdkProvider<AppCheck>(AppCheckSdkContext);
// export const AuthProvider = getSdkProvider<Auth>(AuthSdkContext);
// export const AnalyticsProvider = getSdkProvider<Analytics>(AnalyticsSdkContext);
// export const DatabaseProvider = getSdkProvider<Database>(DatabaseSdkContext);
// export const FirestoreProvider = getSdkProvider<Firestore>(FirestoreSdkContext);
// export const FunctionsProvider = getSdkProvider<Functions>(FunctionsSdkContext);
// export const PerformanceProvider = getSdkProvider<FirebasePerformance>(
//   PerformanceSdkContext
// );
// export const StorageProvider =
//   getSdkProvider<FirebaseStorage>(StorageSdkContext);
// export const RemoteConfigProvider = getSdkProvider<RemoteConfig>(
//   RemoteConfigSdkContext
// );

// export const useAppCheck = () => useSdk<AppCheck>(AppCheckSdkContext);
// export const useAuth = () => useSdk<Auth>(AuthSdkContext);
// export const useAnalytics = () => useSdk<Analytics>(AnalyticsSdkContext);
// export const useDatabase = () => useSdk<Database>(DatabaseSdkContext);
// export const useFirestore = () => useSdk<Firestore>(FirestoreSdkContext);
// export const useFunctions = () => useSdk<Functions>(FunctionsSdkContext);
// export const usePerformance = () =>
//   useSdk<FirebasePerformance>(PerformanceSdkContext);
// export const useStorage = () => useSdk<FirebaseStorage>(StorageSdkContext);
// export const useRemoteConfig = () =>
//   useSdk<RemoteConfig>(RemoteConfigSdkContext);

// // useInitSdk left out b/c not using observables

// // type InitSdkHook<Sdk extends FirebaseSdks> = (
// //   initializer: (firebaseApp: FirebaseApp) => Promise<Sdk>,
// //   options?: ReactFireOptions<Sdk>
// // ) => ObservableStatus<Sdk>;

// // export const useInitAppCheck: InitSdkHook<AppCheck> = (initializer, options) =>
// //   useInitSdk<AppCheck>('appcheck', AppCheckSdkContext, initializer, options);
// // export const useInitAuth: InitSdkHook<Auth> = (initializer, options) =>
// //   useInitSdk<Auth>('auth', AuthSdkContext, initializer, options);
// // export const useInitAnalytics: InitSdkHook<Analytics> = (initializer, options) =>
// //   useInitSdk<Analytics>('analytics', AnalyticsSdkContext, initializer, options);
// // export const useInitDatabase: InitSdkHook<Database> = (initializer, options) =>
// //   useInitSdk<Database>('database', DatabaseSdkContext, initializer, options);
// // export const useInitFirestore: InitSdkHook<Firestore> = (initializer, options) =>
// //   useInitSdk<Firestore>('firestore', FirestoreSdkContext, initializer, options);
// // export const useInitFunctions: InitSdkHook<Functions> = (initializer, options) =>
// //   useInitSdk<Functions>('functions', FunctionsSdkContext, initializer, options);
// // export const useInitPerformance: InitSdkHook<FirebasePerformance> = (initializer, options) =>
// //   useInitSdk<FirebasePerformance>('performance', PerformanceSdkContext, initializer, options);
// // export const useInitRemoteConfig: InitSdkHook<RemoteConfig> = (initializer, options) =>
// //   useInitSdk<RemoteConfig>('remoteconfig', RemoteConfigSdkContext, initializer, options);
// // export const useInitStorage: InitSdkHook<FirebaseStorage> = (initializer, options) =>
// //   useInitSdk<FirebaseStorage>('storage', StorageSdkContext, initializer, options);
