import React, { useState } from 'react';
import { Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const APK_URL =
  process.env.EXPO_PUBLIC_APK_URL ??
  'https://github.com/rehanilyas20196-design/BU-APPLICATION-APK-FILES/releases/download/v1.0.0/BU-ENTRY-TEST.apk';
const APK_FILENAME = 'buet-prep-ai.apk';
const STYLE_ID = 'buet-promo-banner-styles';

/**
 * True when the page is running inside the installed Android app (a WebView
 * wrapper of this website). The app wrapper is expected to either append a
 * custom user-agent marker (e.g. "BUETPrepApp/1.0") or inject a standalone
 * flag on `window` before loading the site. The banner is skipped in that
 * case so it only ever appears on the public website.
 */
function isInsideInstalledApp(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || '').toLowerCase();
  if (ua.includes('buetprep') || ua.includes('buet-prep')) return true;
  const w = window as unknown as Record<string, unknown>;
  if (w.__BUET_PREP_STANDALONE__ === true) return true;
  if (w.BUET_PREP_STANDALONE === true) return true;
  return false;
}

function resolveApkUrl(): string {
  if (/^https?:\/\//.test(APK_URL)) return APK_URL;
  if (typeof window !== 'undefined') {
    return new URL(APK_URL, window.location.origin).toString();
  }
  return APK_URL;
}

const BANNER_CSS = `
.buetpromo {
  position: relative;
  overflow: hidden;
  background: linear-gradient(96deg, #0A0E1F 0%, #0F1B31 48%, #0A0E1F 100%);
  border-bottom: 1px solid rgba(45, 212, 191, 0.16);
}
.buetpromo::before {
  content: '';
  position: absolute;
  inset: -80px;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(45, 212, 191, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 212, 191, 0.05) 1px, transparent 1px),
    radial-gradient(circle, rgba(45, 212, 191, 0.12) 1px, transparent 1.4px);
  background-size: 44px 44px, 44px 44px, 22px 22px;
  animation: buetpromo-grid 18s linear infinite;
}
.buetpromo::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20%;
  width: 60%;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(45, 212, 191, 0.1), transparent 70%);
}
.buetpromo-inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 9px 16px;
}
.buetpromo-icon {
  position: relative;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%);
  border: 1px solid rgba(45, 212, 191, 0.5);
  animation: buetpromo-glow 2.6s ease-in-out infinite;
}
.buetpromo-copy {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.buetpromo-eyebrow {
  font-family: 'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: #FBBF24;
  line-height: 1.2;
}
.buetpromo-title {
  font-family: 'Space Grotesk', 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: #F8FAFC;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.buetpromo-subtext {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  color: rgba(203, 213, 225, 0.85);
}
.buetpromo-btn {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 999px;
  background: linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
  border: 1px solid rgba(45, 212, 191, 0.55);
  box-shadow: 0 4px 16px rgba(20, 184, 166, 0.35);
  color: #FFFFFF;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.buetpromo-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.5);
}
.buetpromo-btn:active {
  transform: translateY(0) scale(0.97);
}
.buetpromo-btn::after {
  content: '';
  position: absolute;
  top: -40%;
  left: 0;
  width: 34%;
  height: 180%;
  background: linear-gradient(105deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.45) 50%, rgba(255, 255, 255, 0) 100%);
  transform: translateX(-160%) skewX(-20deg);
  animation: buetpromo-sweep 3s ease-in-out infinite;
  pointer-events: none;
}
.buetpromo-btn-arrow {
  display: inline-flex;
  align-items: center;
  animation: buetpromo-bob 1.5s ease-in-out infinite;
}
.buetpromo-btn-label {
  white-space: nowrap;
}
.buetpromo-close {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-left: 2px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.buetpromo-close:hover {
  color: #FFFFFF;
  background-color: rgba(255, 255, 255, 0.08);
}

@keyframes buetpromo-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(45, 212, 191, 0), 0 0 16px 0 rgba(45, 212, 191, 0.18); }
  50% { box-shadow: 0 0 0 7px rgba(45, 212, 191, 0.1), 0 0 28px 3px rgba(45, 212, 191, 0.4); }
}
@keyframes buetpromo-sweep {
  0% { transform: translateX(-160%) skewX(-20deg); }
  55%, 100% { transform: translateX(400%) skewX(-20deg); }
}
@keyframes buetpromo-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
@keyframes buetpromo-grid {
  0% { background-position: 0 0, 0 0, 0 0; }
  100% { background-position: 44px 26px, 44px 26px, 44px 26px; }
}

@media (max-width: 760px) {
  .buetpromo-subtext { display: none; }
}
@media (max-width: 520px) {
  .buetpromo-title { font-size: 13.5px; }
  .buetpromo-btn { padding: 9px 12px; }
  .buetpromo-btn-label { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .buetpromo::before,
  .buetpromo-icon,
  .buetpromo-btn::after,
  .buetpromo-btn-arrow { animation: none !important; }
}
`;

if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = BANNER_CSS;
  document.head.appendChild(styleEl);
}

/** Promotional strip pinned at the very top of the website. Web only. */
export function DownloadTopBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (Platform.OS !== 'web') return null;
  if (isInsideInstalledApp()) return null;
  if (dismissed) return null;

  return (
    <div className="buetpromo" role="region" aria-label="Get the Android app">
      <div className="buetpromo-inner">
        <div className="buetpromo-icon" aria-hidden>
          <MaterialCommunityIcons name="android" size={22} color="#FFFFFF" />
        </div>

        <div className="buetpromo-copy">
          <span className="buetpromo-eyebrow">Get the Android app</span>
          <span className="buetpromo-title">Install BUET Prep AI on your phone</span>
          <span className="buetpromo-subtext">
            for the best experience — offline access, mock tests and progress tracking
          </span>
        </div>

        <a
          className="buetpromo-btn"
          href={resolveApkUrl()}
          download={APK_FILENAME}
          aria-label="Download APK"
        >
          <span className="buetpromo-btn-arrow" aria-hidden>
            <MaterialCommunityIcons name="download" size={16} color="#FFFFFF" />
          </span>
          <span className="buetpromo-btn-label">Download APK</span>
        </a>

        <button
          type="button"
          className="buetpromo-close"
          aria-label="Dismiss download banner"
          onClick={() => setDismissed(true)}
        >
          <MaterialCommunityIcons name="close" size={16} color="currentColor" />
        </button>
      </div>
    </div>
  );
}