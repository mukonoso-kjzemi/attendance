<script lang="ts">
    import { page } from '$app/stores';
    import StatusCounter from './StatusCounter.svelte';
    
    export let title = '滞在管理システム v1.2';
    export let showCounter = true;
    export let showAdminLink = true;
    
    import { onMount } from 'svelte';
    
    let currentPath = '/';
    $: isAdmin = currentPath.startsWith('/admin');
    
    onMount(() => {
      // 現在のパスを取得（ハッシュから）
      currentPath = window.location.hash.slice(1) || '/';
      
      // ハッシュの変更を監視
      window.addEventListener('hashchange', () => {
        currentPath = window.location.hash.slice(1) || '/';
      });
    });
  </script>
  
  <header class="header">
    <div class="header-content">
      <div class="title-area">
        <h1>{title}</h1>
        
        {#if showCounter}
          <div class="counter-area">
            <StatusCounter />
          </div>
        {/if}
      </div>
      
      <div class="nav-links">
        {#if isAdmin}
          <a href="/#" class="nav-link home">トップ</a>
        {:else if showAdminLink}
          <a href="/#/admin" class="nav-link admin">管理</a>
        {/if}
      </div>
    </div>
  </header>
  
  <style>
    .header {
      background-color: #f5f5f5;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .title-area {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    h1 {
      font-size: 18px;
      color: #1976d2;
      margin: 0;
      white-space: nowrap;
    }
    
    .nav-links {
      display: flex;
      gap: 8px;
    }
    
    .nav-link {
      padding: 4px 10px;
      text-decoration: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      transition: all 0.2s;
    }
    
    .nav-link.admin {
      background-color: #1976d2;
      color: white;
    }
    
    .nav-link.admin:hover {
      background-color: #1565c0;
    }
    
    .nav-link.home {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }
    
    .nav-link.home:hover {
      background-color: #e0e0e0;
    }
    
    @media (max-width: 480px) {
      .header-content {
        padding: 0 8px;
      }
      
      .counter-area {
        transform: scale(0.85);
        transform-origin: left center;
      }
    }
  </style>