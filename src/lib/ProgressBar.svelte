<script>
  import { statusesIndexMap } from "./utils.js";
  export let type;
  export let statusIndex;

  const barChunkCss = `${type} flex-1 px-2`;
</script>


<div class="rounded-lg my-1 flex text-center overflow-hidden border-2 border-gray-400 bg-white text-black font-normal">
  {#each statusesIndexMap[type] as statusName, i}
    {#if statusName !== null}
      <div class={barChunkCss} class:selected={statusIndex === i}>
        {statusName}
      </div>
    {/if}
  {/each}
</div>

<style>
  .story.selected {
    background-color: rgb(167, 243, 208);
  }
  .estimate.selected {
    background-color: rgb(255, 203, 147);
  }
</style> 