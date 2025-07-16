// キャッシュの名前とバージョン
const CACHE_NAME = 'stay-manager-cache-v1';

// キャッシュするアセット
const ASSETS_TO_CACHE = [
  './',
  './manifest.json',
  './favicon.ico',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png'
];

// インストール時の処理
self.addEventListener('install', (event) => {
  // キャッシュの登録
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((err) => {
        console.error('Service worker installation failed:', err);
      })
  );
});

// アクティベート時の処理
self.addEventListener('activate', (event) => {
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// キャッシュ可能なURLかチェック
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // httpまたはhttpsのみを許可
    return (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
  } catch (e) {
    return false;
  }
}

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  // URLが無効なリクエストはキャッシュしない
  // chrome-extension:// など、http/https以外のスキームを持つURLはスキップ
  if (!isValidUrl(event.request.url)) {
    return;
  }

  // Firebase関連リクエストはキャッシュしない
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('firebase')) {
    return;
  }
  
  // HTMLリクエストに対しては常にネットワークを優先し、キャッシュをフォールバックとして使用
  if (event.request.headers.get('accept') && 
      event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 成功レスポンスをキャッシュに追加
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから取得
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 静的アセットに対してはキャッシュを優先し、ネットワークをフォールバックとして使用
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュがなければネットワークから取得
        return fetch(event.request)
          .then((response) => {
            // 無効なレスポンスはキャッシュしない
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをキャッシュに追加（URL検証済み）
            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.warn('Failed to cache:', event.request.url, err);
                });
            } catch (error) {
              console.warn('Error during caching:', error);
            }
              
            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            // エラー時の処理（オプション）
          });
      })
  );
});