import { goto } from '$app/navigation';
import { base } from '$app/paths';

export const ssr = false;

// ハッシュベースのルーティングを設定
if (typeof window !== 'undefined') {
  const pathname = window.location.pathname;
  const hash = window.location.hash.slice(1);

  // 初期ロード時、ハッシュがない場合はパスをハッシュに変換
  if (pathname !== '/' && !hash) {
    window.location.replace(`/#${pathname}`);
  }
  // ハッシュがある場合はそのパスに遷移
  else if (hash) {
    goto(hash);
  }

  // ハッシュの変更を監視
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.slice(1);
    if (newHash) {
      goto(newHash);
    }
  });
}