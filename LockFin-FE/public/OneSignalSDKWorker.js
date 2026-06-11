// OneSignal service worker for web push. Kept separate from any app/PWA
// service worker: it only handles push + notification clicks and never caches
// app assets, so it cannot serve stale JS the way next-pwa's worker did.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
