import { createContext, useContext } from 'react';

export const AuthenticatedLayoutContext = createContext<boolean>(false);

export function useIsInsideAuthenticatedLayout(): boolean {
  return useContext(AuthenticatedLayoutContext);
}
