<script>
  import { displayStr } from "./utils.js";
  import ProgressBar from "./ProgressBar.svelte";
  export let title;
  export let estimate;
  export let minStoryStatusIndex;
  export let minEstimateStatusIndex;
</script>

<div class="flex flex-col border-2 border-gray-500 bg-gray-100 px-2 py-1 font-semibold rounded-md">
  <div class="flex flex-row">
    <div class="flex-1 text-lg ">{title}</div>
    <div>{displayStr(Math.round((estimate + Number.EPSILON) * 1000) / 1000)}</div>
  </div>
    <div class="flex items-end">
      <div class="flex-1"></div>
      <div class="flex gap-x-3">
        <ProgressBar type="story" statusIndex={minStoryStatusIndex} />
        <ProgressBar type="estimate" statusIndex={minEstimateStatusIndex} />
      </div>
    </div>
</div>