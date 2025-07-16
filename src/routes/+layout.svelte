<script lang="ts">
    import { onMount } from 'svelte';
    import '../app.css';
    import { initializeApp } from '$lib';
    
    onMount(async () => {
      // アプリケーションの初期化
      await initializeApp();
    });
  </script>
  
  <div class="app">
    <main>
      <slot />
    </main>
    
    <footer class="footer">
      <div class="footer-content">
        <p>© {new Date().getFullYear()} 滞在管理システム</p>
      </div>
    </footer>
  </div>
  
  <style>
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    
    main {
      flex: 1;
    }
    
    .footer {
      margin-top: 40px;
      padding: 16px 0;
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>