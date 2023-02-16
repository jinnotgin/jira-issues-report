<script>
  import { percentageString, decimalString } from "./utils.js";
  export let completion;
  export let total;
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3">
  <div>
    <p class="font-semibold underline">Stories</p>
    <div class="grid grid-cols-3 gap-y-1">
      <span>Incomplete</span>
      <code>{percentageString(completion.storyCount.writing[0] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.writing[0])}</code>
      <span>Written</span>
      <code>{percentageString(completion.storyCount.writing[1] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.writing[1])}</code>
      <span>In Review</span>
      <code>{percentageString(completion.storyCount.writing[2] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.writing[2])}</code>
      <span>Done</span>
      <code>{percentageString(completion.storyCount.writing[3] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.writing[3])}</code>
    </div>
  </div>
  <div>
    <p class="font-semibold underline">Estimate</p>
    <div class="grid grid-cols-3 gap-y-1">
      <span>Incomplete</span>
      <code>{percentageString(completion.storyCount.estimation[0] / total.storyCount)}</code>
      <code>-</code>
      <span>High Level</span>
      <code>{percentageString(completion.storyCount.estimation[2] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.estimation[2])}</code>
      <span>Detail Level</span>
      <code>{percentageString(completion.storyCount.estimation[3] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.estimation[3])}</code>
      <span>Done</span>
      <code>{percentageString(completion.storyCount.estimation[4] / total.storyCount)}</code>
      <code>{decimalString(completion.storyPoints.estimation[4])}</code>
    </div>
  </div>
  <div>
    <p class="font-semibold underline">Total Points</p>
    <div class="grid grid-cols-2 gap-y-1">
      <span>Estimated</span>
      <code>{decimalString(total.storyPoints)}</code>
      <span>Written</span>
      <code>{decimalString(completion.storyPoints.writing[1] + completion.storyPoints.writing[2] + completion.storyPoints.writing[3])}</code>
    </div>
  </div>
</div>