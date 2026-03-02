import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/widget.css';

// Read config from URL params (set by widget-loader.js)
const params = new URLSearchParams(window.location.search);
const orgId = params.get('orgId') || 'demo_org_1';
const primaryColor = params.get('color') || '#6366f1';

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

