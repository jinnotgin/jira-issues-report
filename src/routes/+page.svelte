<script>
  // TODO - add legend
  // EXPLORE - how do we track when something is sign off
  // EXPLORE - how do we track when someting is estimate is reviewed
  import Accordion from "$lib/Accordion.svelte";
  import Epic from "$lib/Epic.svelte";
  import UserStory from "$lib/UserStory.svelte";
  import SummaryBlock from "$lib/SummaryBlock.svelte";
  import MultiSelect from "$lib/MultiSelect.svelte";
  import BurnChart from "$lib/BurnChart.svelte";
  import processData from "$lib/dataProcessing.js";
  import { ISOStringToDateString } from "$lib/utils.js";
  import CONSTANTS from "$lib/constants.js";

  let report = {
    data: [],
    generatedDateTime: null
  };
  let sprintStartDate;
  let sprintDurationWeeks;
  let sprintGroomingTarget;

  // import data from config (ie pre-configured)
  import CONFIG from "$lib/config.js";
  report = CONFIG.reportExport;
  sprintStartDate = CONFIG.sprintStartDate;
  sprintDurationWeeks = CONFIG.sprintDurationWeeks;
  sprintGroomingTarget = CONFIG.sprintGroomingTarget;

  $: reportTitle = `Grooming Progress${
    report.generatedDateTime
      ? ` - ${ISOStringToDateString(report.generatedDateTime)}`
      : ""
  }`;

  // import data function
  const importData_onClick = () => {
    try {
      const rawInput = prompt("Paste JSON report data here");
      if (rawInput !== null) {
        const jsonData = JSON.parse(rawInput);
        if (!Object.keys(jsonData).includes("data")) throw "Missing data";

        // report = jsonData;
        // TODO: add optimisation to prevent recomputation of already computed data
        // TODO: add optimisation to prevent repeat data
        report = {
          status: jsonData.status,
          data: [...report.data, ...jsonData.data],
          generatedDateTime: jsonData.generatedDateTime
        };
        console.log(report);
      }
    } catch (e) {
      alert("Error processing JSON report data");
    }
  };

  // import data function
  const resetData_onClick = () => {
    report = CONSTANTS.EMPTY_REPORT_TEMPLATE;
  };

  // accordion
  const accordionsOpen = {
    summary: true,
    burnup: false,
    epics: {}
  };
  const areSomeEpicAccordionsClosed = () =>
    Object.values(accordionsOpen.epics).some(item => item === false);
  const setAllEpicAccordions = state => {
    for (const epicId of Object.keys(accordionsOpen.epics)) {
      accordionsOpen.epics[epicId] = state;
    }
  };
  const toggleEpicsOpen_onClick = () => {
    // if some are closed (ie. true), then we want all to be open (ie. also true)
    // otherwise (ie. false), then we want all to be closed (ie. also false)
    const targetState = areSomeEpicAccordionsClosed();
    setAllEpicAccordions(targetState);
  };

  // summary aggregation & filters
  let aggregations = {};
  let burnupChartData = [];
  let activeFilters = [];
  let filteredReportData = [];
  $: {
    const processed = processData(report.data, activeFilters);

    filteredReportData = processed.filteredReportData;
    aggregations = processed.aggregations;
    burnupChartData = processed.burnupChartData;

    if (activeFilters.length > 0 && areSomeEpicAccordionsClosed()) {
      setAllEpicAccordions(true);
    }
  }
</script>

<svelte:head>
	<title>Jira Issue Report - Jin</title>
  <style>
</style>
</svelte:head>

<div class="h-screen flex flex-col m-auto max-w-5xl">
  <div class="flex m-3 gap-1">
    <input type="text" class="flex-1 text-3xl font-bold hover:bg-gray-100 focus:bg-white" value={reportTitle}/>
    <div>
      <button class="border-2 py-1 px-2 rounded-lg bg-gray-200 hover:bg-gray-300" on:click={importData_onClick} on:keypress={importData_onClick}>Add</button>
      <button class="border-2 py-1 px-2 rounded-lg bg-gray-200 hover:bg-gray-300" on:click={resetData_onClick} on:keypress={resetData_onClick}>Reset</button>
    </div>
  </div>

  <div class="my-2">
    <Accordion bind:open={accordionsOpen.summary}>
      <div slot="head" class="px-2 text-lg font-semibold rounded-lg bg-blue-200 border-2 border-blue-400">
        <h1>Summary Statistics</h1>
      </div>
      <div slot="details" class="p-3 text-md bg-blue-100 mx-3 my-2 rounded-lg">
          <SummaryBlock 
            completion={aggregations.completion}
            total={aggregations.total}
          />
      </div>
    </Accordion>
  </div>

  <div class="my-2">
    <Accordion bind:open={accordionsOpen.burnup}>
      <div slot="head" class="px-2 text-lg font-semibold rounded-lg bg-blue-200 border-2 border-blue-400">
        <h1>Burn Chart</h1>
      </div>
      <div slot="details" class="p-3 text-md bg-white mx-3 my-2 rounded-lg"> <!--bg-green-50-->
        <BurnChart direction="down" data={burnupChartData} startDate={sprintStartDate} durationWeeks={sprintDurationWeeks} targetPoints={sprintGroomingTarget}/>
      </div>
    </Accordion>
  </div>

  <hr class="mb-2 mt-4"/>

  <div class="my-2 text-md flex gap-3 items-center pl-2">
    <div>Showing:</div>
    <div class="flex-1">
      <MultiSelect id="filter" bind:value={activeFilters} placeholder="All">
        <option value hidden></option> <!-- first option empty is a hack: to deal with Svelte behaviour of auto defaulting first option as selected-->
        <option value="pendingDiscussion">Pending: Discussion</option>
        <option value="pendingFigma">Pending: Figma</option>
        <option value="pendingAcClarifications">Pending: AC Clarifications</option>
        <option value="storyIncomplete">Story: Incomplete</option>
        <option value="storyWritten">Story: Written</option>
        <option value="storyReview">Story: In Review</option>
        <option value="storyDone">Story: Done</option>
        <option value="estimateIncomplete">Estimate: Incomplete</option>
        <option value="estimateHigh">Estimate: High Level</option>
        <option value="estimateDetail">Estimate: Detail Level</option>
        <option value="estimateDone">Estimate: Done</option>
        <option value="storyPeerReviewIncomplete">Story: Not Peer Reviewed</option>
      </MultiSelect> 
    </div>
    <div>
      <button class="border-2 py-1 px-2 rounded-lg bg-gray-200 hover:bg-gray-300" on:click={toggleEpicsOpen_onClick} on:keypress={toggleEpicsOpen_onClick}>Toggle</button>
    </div>
  </div>

  <ul class="mb-10">
    {#if filteredReportData.length === 0}
      <li class="text-center py-6">
        <p class="text-5xl mb-4">😲</p>
        <p class="font-bold">No data found!</p>
        {#if report.data.length === 0}
          <p>Please <span class="underline cursor-pointer" on:click={importData_onClick} on:keypress={importData_onClick}>add</span> a report JSON.</p>
        {:else if filteredReportData.length === 0}
          <p>Please remove some filters.</p>
        {/if}
      </li>
    {/if}
    {#each filteredReportData as epic, i}
      <li>
        <Accordion bind:open={accordionsOpen.epics[epic.issueId]}>
          <div slot="head">
            <Epic 
              title={epic.title.replace("!_","")} 
              estimate={epic.estimate !== null && epic.storiesEstimate === 0 ? epic.estimate : epic.storiesEstimate}
              minStoryStatusIndex={aggregations.epicsStatus[i].minStoryStatusIndex}
              minEstimateStatusIndex={aggregations.epicsStatus[i].minEstimateStatusIndex}
            />
          </div>
          <div slot="details">
            {#each epic.stories as story}
              <UserStory {...story} />
            {/each}
          </div>
        </Accordion>
      </li>
      <hr class="my-2"/>
    {/each}
  </ul>

  <footer class="text-center mt-auto pb-4">
    <p class="font-medium">{CONSTANTS.APP_NAME} - Version {CONSTANTS.APP_VERSION}</p>
    <p class="font-extralight italic">Created by <a class="underline" href="https://jinn.me" target="_blank" rel="noreferrer">Jin</a>, 2022</p>
  </footer>

</div>