<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { 
      initMembersListener, 
      cleanupAllListeners, 
      sortedMembers,
      connectionStatus,
      lastUpdateTime
    } from '$lib/stores/members';
    import MemberList from '$lib/components/MemberList.svelte';
    import Header from '$lib/components/Header.svelte';
    
    let unsubscribe: () => void;
    
    // 手動更新
    const refreshData = () => {
      // 既存のリスナーをクリーンアップして再初期化
      cleanupAllListeners();
      unsubscribe = initMembersListener();
    };
    
    onMount(() => {
      // リアルタイムリスナーを初期化
      unsubscribe = initMembersListener();
      
      // タブがアクティブになったときに確認
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // 接続が切れている場合は再接続
          if ($connectionStatus === 'disconnected') {
            refreshData();
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });
    
    onDestroy(() => {
      // すべてのリスナーをクリーンアップ
      cleanupAllListeners();
    });
  </script>
  
  <svelte:head>
    <title>滞在管理システム</title>
  </svelte:head>
  
  <div class="home-page">
    <Header />
    <main>
      <MemberList />
    </main>
    <button 
      class="refresh-button"
      on:click={() => {
        // アイコンに回転アニメーションを追加
        const icon = document.querySelector('.refresh-icon') as HTMLElement;
        icon.style.animation = 'none';
        icon.offsetHeight; // リフロー
        icon.style.animation = 'spin 0.5s linear';
        
        // キャッシュを削除
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        // ページを更新
        window.location.reload();
      }}
    >
      <svg class="refresh-icon" viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      更新
    </button>
  </div>
  
  <style>
    :global(body) {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }

    .home-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px 16px 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-bottom: 16px;
    }
    
    @media (max-width: 768px) {
      .home-page {
        padding: 12px 12px 0;
      }
    }

    .refresh-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .refresh-button:hover {
      background-color: #45a049;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .refresh-button:active {
      transform: translateY(0);
    }

    .refresh-icon {
      transition: transform 0.3s ease;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .refresh-button {
        bottom: 16px;
        right: 16px;
        padding: 10px 20px;
        font-size: 14px;
      }
    }
  </style>