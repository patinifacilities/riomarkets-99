import { create } from 'zustand';
import { LEGAL_VERSION } from '@/lib/legal';
import { useEffect, useState, useRef } from 'react';

const STORAGE_KEY = 'rio:compliance_ack';

type ComplianceState = {
  open: boolean;
  mounted: boolean;
  version: string;
  acknowledge: () => void;
  reset: () => void;
  setMounted: (mounted: boolean) => void;
};

function shouldOpen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const acknowledgedVersion = localStorage.getItem(STORAGE_KEY);
    return acknowledgedVersion !== LEGAL_VERSION;
  } catch {
    return true;
  }
}

export const useComplianceBanner = create<ComplianceState>((set, get) => ({
  open: false, // Start as false for SSR safety
  mounted: false,
  version: LEGAL_VERSION,
  setMounted: (mounted: boolean) => {
    const shouldBeOpen = mounted && shouldOpen();
    set({ mounted, open: shouldBeOpen });
    
    // Add body class for safe spacing
    if (typeof document !== 'undefined') {
      if (shouldBeOpen) {
        document.body.classList.add('has-compliance-banner');
      } else {
        document.body.classList.remove('has-compliance-banner');
      }
    }
  },
  acknowledge: () => {
    try {
      localStorage.setItem(STORAGE_KEY, LEGAL_VERSION);
    } catch {
      // Silent fail for localStorage issues
    }
    
    // Remove body class
    if (typeof document !== 'undefined') {
      document.body.classList.remove('has-compliance-banner');
    }
    
    set({ open: false });
  },
  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail for localStorage issues
    }
    set({ open: true });
    
    // Add body class
    if (typeof document !== 'undefined') {
      document.body.classList.add('has-compliance-banner');
    }
  },
}));

// Hook for safe SSR hydration
export function useComplianceBannerSafe() {
  const banner = useComplianceBanner();
  const setMountedRef = useRef(banner.setMounted);
  const [mounted, setMounted] = useState(false);

  // Update ref when banner.setMounted changes
  useEffect(() => {
    setMountedRef.current = banner.setMounted;
  }, [banner.setMounted]);

  // Run only once on mount
  useEffect(() => {
    setMounted(true);
    setMountedRef.current(true);
  }, []); // Empty dependency array - runs only once

  return {
    ...banner,
    mounted,
    shouldRender: mounted && banner.open
  };
}