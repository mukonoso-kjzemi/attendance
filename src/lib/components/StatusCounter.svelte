<script lang="ts">
    import { inRoomCount } from '$lib/stores/members';
    import { spring } from 'svelte/motion';
    import { onMount } from 'svelte';
    
    // カウンターアニメーション用のspring値
    const displayCount = spring(0, {
      stiffness: 0.1,
      damping: 0.4
    });
    
    // カウンターが変更されたらspringを更新
    $: $displayCount = $inRoomCount;
    
    onMount(() => {
      // 初回マウント時に現在の値に設定
      displayCount.set($inRoomCount, { hard: true });
    });
  </script>
  
  <div class="counter-container">
    <span class="counter-value">
      {Math.round($displayCount)}
      <span class="unit">人</span>
    </span>
    <span class="counter-label">入室中</span>
  </div>
  
  <style>
    .counter-container {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: #1976d2;
      color: white;
      padding: 4px 8px;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .counter-value {
      font-size: 16px;
      font-weight: bold;
      line-height: 1;
    }
    
    .unit {
      font-size: 11px;
      margin-left: 1px;
    }
    
    .counter-label {
      font-size: 11px;
    }
  </style>