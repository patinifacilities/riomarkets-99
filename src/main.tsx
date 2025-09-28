import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        storageKey="rio-markets-theme"
        disableTransitionOnChange={false}
      >
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
