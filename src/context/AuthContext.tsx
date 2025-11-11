// import type { User } from 'firebase/auth';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import type { ReactNode } from 'react';
// import { createContext, useContext, useEffect, useState } from 'react';

// export interface AuthContext {
//   isAuthenticated: boolean;
//   // login: (username: string) => Promise<void>;
//   // logout: () => Promise<void>;
//   user: User | null;
// }

// const AuthContext = createContext<AuthContext | null>(null);

// export function AuthStateProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const isAuthenticated = !!user;

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(getAuth(), (u) => {
//       // console.log('AUTH STATE CHANGE: ', u);
//       setUser(u);
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, isAuthenticated }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within an AuthProvider');

//   return context;
// }

export {};
