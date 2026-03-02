/**
 * ChatBot Widget Loader – inject this from your CDN.
 *
 * Usage:
 *   <script src="https://cdn.yourdomain.com/widget-loader.js"
 *           data-org-id="ORG_123"
 *           data-primary-color="#6366f1"></script>
 */
(function () {
    'use strict';

    const script = document.currentScript;
    const orgId = script.dataset.orgId || '';
    const color = encodeURIComponent(script.dataset.primaryColor || '#6366f1');

    // Widget host URL – change this to your deployed widget URL
    const WIDGET_HOST = script.dataset.widgetUrl || 'http://localhost:5174';
    const src = `${WIDGET_HOST}?orgId=${encodeURIComponent(orgId)}&color=${color}`;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-widget-frame';
    iframe.src = src;
    iframe.allow = 'microphone; camera';
    iframe.setAttribute('aria-label', 'Chat support widget');

    // Collapsed (bubble) state
    const BUBBLE_SIZE = '50px';
    const PANEL_W = '380px';
    const PANEL_H = '580px';

    function applyStyle(expanded) {
        const isMobile = window.innerWidth < 768;
        if (expanded) {
            iframe.style.cssText = isMobile
                ? `position:fixed;bottom:0;right:0;width:100vw;height:100dvh;border:none;z-index:999999;border-radius:0;transition:all 0.3s ease;background:transparent;`
                : `position:fixed;bottom:0px;right:0px;width:${PANEL_W};height:${PANEL_H};border:none;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);z-index:999999;transition:all 0.3s ease;background:transparent;`;
        } else {
            iframe.style.cssText = `position:fixed;bottom:20px;right:20px;width:${BUBBLE_SIZE};height:${BUBBLE_SIZE};border:none;border-radius:9999px;z-index:999999;background:transparent;transition:all 0.3s ease;`;
        }
    }

    // Start in bubble (collapsed) state
    applyStyle(false);

    // Handle postMessage from widget iframe
    window.addEventListener('message', function (event) {
        // Only trust messages from our widget origin
        if (!event.origin || !WIDGET_HOST.startsWith(event.origin.replace(/\/$/, '').replace(/^https?:\/\//, '').split('/')[0])) {
            // In development, allow all – tighten in production
        }
        if (event.data && event.data.type === 'WIDGET_TOGGLE') {
            applyStyle(event.data.expanded === true);
        }
    });

    // Handle window resize (mobile ↔ desktop)
    let resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            const isExpanded = iframe.style.width !== BUBBLE_SIZE;
            applyStyle(isExpanded);
        }, 150);
    });

    document.body.appendChild(iframe);
})();
