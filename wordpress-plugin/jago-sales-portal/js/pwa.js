/* Android PWA Installation & Service Worker Controller for Jago Corporation PLC */

let deferredPrompt = null;

document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  initPwaInstallPrompt();
});

// Register Service Worker for offline capability
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
          reg.update();
        })
        .catch((err) => {
          console.log('[PWA] ServiceWorker registration failed:', err);
        });
    });
  }
}

// Capture Android Native "Add to Home Screen" Install Prompt
function initPwaInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser banner
    e.preventDefault();
    deferredPrompt = e;

    // Show Install Android App buttons in UI
    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => {
      btn.style.display = 'inline-flex';
      btn.addEventListener('click', promptAndroidInstall);
    });

    const installBanners = document.querySelectorAll('.pwa-install-banner');
    installBanners.forEach(banner => {
      banner.style.display = 'flex';
    });
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] Jago Sales App installed successfully on Android!');
    deferredPrompt = null;

    const installBtns = document.querySelectorAll('.pwa-install-btn');
    installBtns.forEach(btn => {
      btn.innerHTML = '<i class="ri-checkbox-circle-fill"></i> App Installed';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    });

    const installBanners = document.querySelectorAll('.pwa-install-banner');
    installBanners.forEach(banner => {
      banner.style.display = 'none';
    });
  });
}

// Trigger Android native installation modal
function promptAndroidInstall() {
  if (!deferredPrompt) {
    alert('To install Jago Sales App on Android:\n1. Open Chrome/Browser Menu (⋮)\n2. Tap "Add to Home Screen" or "Install App".');
    return;
  }

  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted Android installation prompt');
    } else {
      console.log('[PWA] User dismissed Android installation prompt');
    }
    deferredPrompt = null;
  });
}
