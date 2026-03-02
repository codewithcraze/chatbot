import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/widget.css';

// Read config from URL params (if loaded via widget-loader.js iframe)
const params = new URLSearchParams(window.location.search);
let orgId = params.get('orgId');
let primaryColor = params.get('color');

// Fallback: If no URL params, try to read from the script tag's dataset (if injected directly)
if (!orgId) {
    // Attempt to grab the script tag that holds the widget payload
    const scriptTag = document.currentScript || document.querySelector('script[data-org-id]');
    if (scriptTag) {
        orgId = scriptTag.dataset.orgId;
        primaryColor = scriptTag.dataset.primaryColor;
    }
}

// Ensure defaults
orgId = orgId || 'demo_org_1';
primaryColor = primaryColor || '#6366f1';

// Inject primary color as CSS variable
document.documentElement.style.setProperty('--primary', primaryColor);

// Create mount point if it doesn't exist
let root = document.getElementById('chat-widget-root');
if (!root) {
    root = document.createElement('div');
    root.id = 'chat-widget-root';
    document.body.appendChild(root);
}

ReactDOM.createRoot(root).render(
    <App orgId={orgId} primaryColor={primaryColor} />
);

