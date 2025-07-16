<script lang="ts">
    import { downloadCSV } from '$lib/utils/export';
    
    export let label = 'CSVでエクスポート';
    export let filename = 'export.csv';
    export let content: string;
    export let disabled = false;
    
    // CSVエクスポート処理
    const handleExport = () => {
      if (disabled || !content) return;
      
      try {
        downloadCSV(content, filename);
      } catch (error) {
        console.error('Export failed:', error);
        alert('エクスポートに失敗しました。再度お試しください。');
      }
    };
  </script>
  
  <button
    class="export-button"
    on:click={handleExport}
    disabled={disabled || !content}
    title={disabled ? 'データがありません' : 'CSVファイルをダウンロード'}
  >
    <span class="icon">📊</span>
    {label}
  </button>
  
  <style>
    .export-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .export-button:hover:not(:disabled) {
      background-color: #388e3c;
    }
    
    .export-button:disabled {
      background-color: #e0e0e0;
      color: #9e9e9e;
      cursor: not-allowed;
    }
    
    .icon {
      font-size: 16px;
    }
  </style>