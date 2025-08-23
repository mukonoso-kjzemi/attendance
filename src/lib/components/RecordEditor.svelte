<script lang='ts'>
  export let memberId: string;
  export let memberName: string;
  export let close: () => void;
</script>

<div>
  <h2>{memberName} の記録を編集中...</h2>
  <p>メンバーID: {memberId}</p>
  <button on:click={close}>閉じる</button>
</div>
