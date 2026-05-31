const fs = require('fs');
let content = fs.readFileSync('src/app/globals.css', 'utf8');

const skeuoCss = `
/* ═══════════════════════════════════════════════════════════
   SKEUOMORPHIC (NEUMORPHIC) THEME OVERRIDES
   ═══════════════════════════════════════════════════════════ */
[data-theme="skeuomorphic"] {
  --background: #f0f0f3;
  --foreground: #333333;
  --primary: #ffffff;
  --primary-hover: #e6e6e6;
  --card-bg: #f0f0f3;
  --border: transparent;
  --text-muted: #888888;
  
  --skeuo-shadow-out: 8px 8px 16px #cbced1, -8px -8px 16px #ffffff;
  --skeuo-shadow-in: inset 6px 6px 12px #cbced1, inset -6px -6px 12px #ffffff;
  --skeuo-shadow-btn-hover: 4px 4px 8px #cbced1, -4px -4px 8px #ffffff;
  --skeuo-shadow-btn-active: inset 4px 4px 8px #cbced1, inset -4px -4px 8px #ffffff;
}

[data-theme="skeuomorphic"] body {
  background: var(--background);
}

[data-theme="skeuomorphic"] .cursor-glow,
[data-theme="skeuomorphic"] .chakra-background {
  display: none; /* Hide background glows for cleaner neumorphism */
}

[data-theme="skeuomorphic"] .glass-card,
[data-theme="skeuomorphic"] .user-profile,
[data-theme="skeuomorphic"] .profile-item {
  background: var(--card-bg);
  border: none;
  box-shadow: var(--skeuo-shadow-out);
  border-radius: 20px;
}

[data-theme="skeuomorphic"] .form-group input, 
[data-theme="skeuomorphic"] .form-group select,
[data-theme="skeuomorphic"] input[type="number"],
[data-theme="skeuomorphic"] .kundli-placeholder {
  background: var(--card-bg) !important;
  border: none !important;
  box-shadow: var(--skeuo-shadow-in) !important;
  border-radius: 12px;
}

[data-theme="skeuomorphic"] .submit-btn,
[data-theme="skeuomorphic"] .btn-login-google,
[data-theme="skeuomorphic"] .tab,
[data-theme="skeuomorphic"] .theme-switcher-btn,
[data-theme="skeuomorphic"] button:not(.profile-delete) {
  background: var(--card-bg) !important;
  border: none !important;
  box-shadow: var(--skeuo-shadow-out);
  color: var(--foreground) !important;
  border-radius: 12px !important;
  transition: all 0.2s ease-in-out;
}

[data-theme="skeuomorphic"] .submit-btn:hover,
[data-theme="skeuomorphic"] .btn-login-google:hover,
[data-theme="skeuomorphic"] button:not(.profile-delete):hover {
  box-shadow: var(--skeuo-shadow-btn-hover) !important;
  transform: scale(0.98);
}

[data-theme="skeuomorphic"] .submit-btn:active,
[data-theme="skeuomorphic"] .btn-login-google:active,
[data-theme="skeuomorphic"] button:not(.profile-delete):active,
[data-theme="skeuomorphic"] .tab.active {
  box-shadow: var(--skeuo-shadow-btn-active) !important;
  transform: scale(0.96);
}

[data-theme="skeuomorphic"] .gold-divider {
  background: transparent;
  box-shadow: var(--skeuo-shadow-in);
  height: 2px;
  border-radius: 1px;
}

/* Ensure Kundli SVG charts still look good but don't clash */
[data-theme="skeuomorphic"] .chart-container,
[data-theme="skeuomorphic"] .chakra-container {
  box-shadow: var(--skeuo-shadow-in);
  border-radius: 50%;
  padding: 1rem;
}

[data-theme="skeuomorphic"] .chart-container {
  border-radius: 16px;
}
`;

content = content + "\n" + skeuoCss;

fs.writeFileSync('src/app/globals.css', content);
console.log('Patched globals.css');
