<script>
  import { displayStr, JIRA_BROWSE_URL } from "./utils.js";
  import ProgressBar from "./ProgressBar.svelte";
  import Tag from "./Tag.svelte";
  export let issueId;
  export let title;
  export let assignee;
  export let estimate;
  export let storyStatusIndex;
  export let estimateStatusIndex;
  export let pendingStatus;
  export let isEstimationReady;

  $: issueUrl = `${JIRA_BROWSE_URL}${issueId}`;
</script>

<div class="flex flex-col rounded-lg bg-gray-200 mx-3 my-2 px-2 py-1">
  <div class="flex">
    <div class="flex-1"><a class="underline" href={issueUrl} target="_blank" rel="noreferrer">{issueId}</a>: {title}</div>
    <div class="w-12 text-right italic">{displayStr(estimate)}</div>
  </div>
  <div class="flex">
    <div class="flex-1 flex items-end gap-2 font-light text-sm">
      <span>{displayStr(assignee)}</span>
      {#if pendingStatus !== "None"}
        <Tag>{`❗ ${pendingStatus}`}</Tag>
      {/if}
      {#if isEstimationReady && estimateStatusIndex === 0}
        <Tag>{`✨ Estimation Ready`}</Tag>
      {/if}
    </div>
    <div class="flex gap-x-3">
      <ProgressBar type="story" statusIndex={storyStatusIndex} />
      <ProgressBar type="estimate" statusIndex={estimateStatusIndex} />
    </div>
  </div>
</div>