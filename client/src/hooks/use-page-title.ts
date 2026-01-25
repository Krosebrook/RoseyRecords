import { useEffect } from 'react';

/**
 * Custom hook to set page-specific document titles
 * @param pageTitle - The page name to append after "HarmoniQ - "
 */
export function usePageTitle(pageTitle: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `HarmoniQ - ${pageTitle}`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
}
