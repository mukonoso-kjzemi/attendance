<script lang="ts">
  import { sortedMembers, inRoomCount } from '$lib/stores/members';
  import { fly } from 'svelte/transition';
  import { format } from 'date-fns';
  import { ja } from 'date-fns/locale';
  import { GRADE_COLORS } from '$lib/constants';
</script>

<div class="member-list-container">
  <div class="members-container">
    {#if $sortedMembers.length === 0}
      <p class="empty-message">メンバーがいません</p>
    {:else}
      <div class="member-list">
        {#each $sortedMembers as member (member.id)}
          <a 
            href="/#/member/{member.id}"
            class="member-item {member.status}"
            style="--grade-color: {GRADE_COLORS[member.grade]}"
            transition:fly={{ y: 10, duration: 200 }}
          >
            <div class="member-info">
              <div class="member-grade">{member.grade}</div>
              <div class="member-name">{member.name}</div>
            </div>
            <div class="member-status-text {member.status}">
              {member.status === 'in' ? '入室中' : '退室中'}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .member-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  .members-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
    border-radius: 12px;
    padding: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .empty-message {
    padding: 12px;
    text-align: center;
    color: #666;
  }
  
  .member-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    align-content: start;
    padding-right: 4px;
    margin: 0;
  }
  
  .member-item {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    position: relative;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    height: 90px;
  }
  
  .member-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
  
  .member-item.in {
    background-color: rgba(13, 207, 23, 0.918);
    border-left: 4px solid var(--grade-color, #4caf50);
    box-shadow: 0 1px 3px rgba(76, 175, 80, 0.25);
  }
  
  .member-item.out {
    background-color: #9e9e9e;
    border-left: 4px solid var(--grade-color, #9e9e9e);
    opacity: 0.9;
  }
  
  .member-info {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
  }
  
  .member-grade {
    display: inline-block;
    padding: 3px 8px;
    background-color: var(--grade-color, #9e9e9e);
    color: white;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    white-space: nowrap;
  }
  
  .member-name {
    font-size: 18px;
    font-weight: bold;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1a1a1a;
  }
  
  .member-status-text {
    position: absolute;
    bottom: 10px;
    right: 10px;
    font-size: 14px;
    font-weight: bold;
    padding: 3px 8px;
    border-radius: 12px;
  }
  
  .member-status-text.in {
    background-color: rgba(255, 255, 255, 0.918);
    color: #1b5e20;
  }
  
  .member-status-text.out {
    background-color: #ffcdd2;
    color: #b71c1c;
  }

  @media (min-width: 600px) {
    .member-item {
      height: 90px;
    }
  }
  
  @media (max-width: 500px) {
    .member-list {
      grid-template-columns: repeat(2, 1fr);
    }
    .member-item {
      height: 55px;
      padding: 6px;
    }
    .member-grade {
      font-size: 12px;
      padding: 2px 6px;
    }
    .member-name {
      font-size: 16px;
    }
    .member-status-text {
      font-size: 12px;
      padding: 2px 6px;
      bottom: 6px;
      right: 6px;
    }
  }
</style>