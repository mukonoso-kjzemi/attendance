<script lang="ts">
    import { connectionStatus, lastUpdateTime, inRoomCount } from '$lib/stores/members';
    import { fly, fade } from 'svelte/transition';
    import { formatDistanceToNow } from 'date-fns';
    import { ja } from 'date-fns/locale';
    
    // 最終更新時刻の相対表示を更新するタイマー
    let intervalId: ReturnType<typeof setInterval>;
    // 現在時刻（1秒ごとに更新）
    let now = new Date();
    
    // モニターの表示状態
    let expanded = false;
    
    // 接続状態に応じたステータス表示
    $: statusColor = {
      'connected': 'green',
      'connecting': 'orange',
      'disconnected': 'red'
    }[$connectionStatus];
    
    // 最終更新からの経過時間
    $: timeAgo = formatDistanceToNow($lastUpdateTime, { 
      addSuffix: true,
      locale: ja 
    });
    
    // コンポーネントがマウントされたときの処理
    import { onMount, onDestroy } from 'svelte';
    
    onMount(() => {
      // 1秒ごとに現在時刻を更新
      intervalId = setInterval(() => {
        now = new Date();
      }, 1000);
    });
    
    onDestroy(() => {
      // タイマーをクリーンアップ
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
    
    // モニターの表示/非表示を切り替え
    const toggleExpand = () => {
      expanded = !expanded;
    };
  </script>
  
  <div class="status-monitor {expanded ? 'expanded' : 'collapsed'}">
    <div 
      class="monitor-header" 
      on:click={toggleExpand}
      on:keydown={(e) => e.key === 'Enter' && toggleExpand()}
      role="button"
      tabindex="0"
    >
      <div class="status-indicator">
        <span class="status-dot" style="background-color: {statusColor}"></span>
        <span class="status-text">{$connectionStatus === 'connected' ? '接続中' : 
          $connectionStatus === 'connecting' ? '接続中...' : '未接続'}</span>
      </div>
      
      <div class="header-info">
        <span class="in-room-count">{$inRoomCount}人入室中</span>
        <span class="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>
    </div>
    
    {#if expanded}
      <div class="monitor-details" transition:fly={{ y: -20, duration: 200 }}>
        <div class="detail-item">
          <span class="detail-label">最終更新:</span>
          <span class="detail-value">{timeAgo}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">更新日時:</span>
          <span class="detail-value">{$lastUpdateTime.toLocaleString()}</span>
        </div>
        
        <div class="detail-item">
          <span class="detail-label">状態:</span>
          <span class="detail-value" style="color: {statusColor}">
            {$connectionStatus === 'connected' ? 'リアルタイム監視中' : 
             $connectionStatus === 'connecting' ? '接続試行中' : '接続が切断されています'}
          </span>
        </div>
      </div>
    {/if}
  </div>
  
  <style>
    .status-monitor {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      width: 300px;
      overflow: hidden;
      z-index: 1000;
      transition: all 0.3s ease;
    }
    
    .monitor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: #f5f5f5;
      cursor: pointer;
      user-select: none;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    
    .status-text {
      font-size: 14px;
      font-weight: bold;
    }
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .in-room-count {
      font-size: 14px;
      font-weight: bold;
    }
    
    .expand-icon {
      font-size: 12px;
      color: #666;
    }
    
    .monitor-details {
      padding: 16px;
      border-top: 1px solid #eee;
      background-color: white;
    }
    
    .detail-item {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    
    .detail-label {
      font-size: 12px;
      color: #666;
    }
    
    .detail-value {
      font-size: 12px;
      font-weight: bold;
    }
    
    /* スマホ向けレスポンシブ対応 */
    @media (max-width: 480px) {
      .status-monitor {
        width: calc(100% - 40px);
        bottom: 10px;
        right: 20px;
        left: 20px;
      }
    }
  </style>