import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker for PWA offline support with auto-update
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Check for updates on page load
      registration.update();
      
      // Check for updates periodically (every 5 minutes)
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available - auto-activate it
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Reload when new SW takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      // Listen for update notifications from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('[PWA] New version available:', event.data.version);
        }
      });

    } catch (error) {
      // Service worker registration failed - app will work without offline support
      console.log('[PWA] Service worker registration failed');
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
