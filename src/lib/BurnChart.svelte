<script>
  export let data;
  export let startDate;
  export let durationWeeks;
  export let targetPoints;
  export let direction = "down";
  import { addDaysToDate, isSetNumberInput, isSetDateInput } from "./utils.js";
  import { LineChart } from "@carbon/charts-svelte";
  import "@carbon/charts/styles.css";

  const dataColors = {
    "UX Signoff Start": "#de425b",
    "UX Signoff End": "#f58055",
    "Story Written": "#fff18f",
    "Story Sent": "#feba65",
    "Story Reviewed": "#003f5c",
    "Estimate Sent": "#488f31",
    "Estimate Reviewed": "#955196"
  };

  // define hidden variables, which only change if user input is validated
  let _startDate = new Date().toLocaleDateString("en-CA");
  let _durationWeeks = 1;
  let _targetPoints = 1;
  $: {
    // valid user inputs
    if (isSetDateInput(startDate)) _startDate = startDate;
    if (isSetNumberInput(durationWeeks)) _durationWeeks = durationWeeks;
    if (isSetNumberInput(targetPoints))
      _targetPoints = direction === "down" ? targetPoints * -1 : targetPoints;
  }

  $: chartStartDate = addDaysToDate(_startDate, -1).toLocaleDateString("en-CA");
  $: chartEndDate = addDaysToDate(
    _startDate,
    (_durationWeeks + 1) * 7
  ).toLocaleDateString("en-CA");

  let sprintWeeksData = [];
  $: {
    sprintWeeksData = [];
    for (let i = 0; i <= _durationWeeks; i++) {
      const result = {
        value: addDaysToDate(_startDate, i * 7),
        // fillColor: "#03a9f4"
        fillColor: "#949394"
      };
      if (i === _durationWeeks) result.label = "End of Sprint";
      else result.label = `Start of Sprint Week ${i + 1}`;

      sprintWeeksData.push(result);
    }
  }

  // if direction is "down", then invert all data
  $: _data = data;
  $: {
    if (direction === "down") {
      for (let item of _data) {
        item.runningTotal = item.runningTotal * -1;
      }
    }
  }
</script>

<div class="flex flex-wrap gap-4">
	<div class="flex gap-1 items-center">
		<span class="font-semibold">Sprint Start:</span>
		<input type="date" class="border-2" bind:value={startDate}>
	</div>
	<div class="flex gap-1 items-center">
		<span class="font-semibold">Weeks in Sprint:</span>
		<input type="number" class="border-2 w-8" min=1 bind:value={durationWeeks}>
	</div>
	<div class="flex gap-1 items-center">
		<span class="font-semibold">Grooming Target:</span>
		<input type="number" class="border-2 w-12" min=1 bind:value={targetPoints}>
	</div>
</div>

<LineChart
	data={_data}
	options={{
	"axes": {
		"bottom": {
			"mapsTo": "date",
			"scaleType": "time",
			"thresholds": sprintWeeksData
		},
		"left": {
			"title": "Estimated Story Points",
			"mapsTo": "runningTotal",
			"scaleType": "linear",
			"thresholds": [
				{
					"value": _targetPoints,
					"label": "Grooming Target",
					"fillColor": "orange"
				}
			]
		}
	},
	// "curve": "curveMonotoneX",
	"curve": "curveStepAfter",
	"height": "500px",
	"legend": {
		"alignment": "left"
	},
  "points": {
    enabled: false
  },
  "tooltip": {
    enabled: false
  },
	"zoomBar": {
		"top": {
			"enabled": true,
			"type": "slider_view",
			"initialZoomDomain": [
				chartStartDate,
        chartEndDate
			],
		}
	},
  color: {
    scale: dataColors
  },
	/*
	"toolbar": {
		"enabled": true,
		"numberOfIcons": 3,
		"controls": [
			{
				"type": "Make fullscreen"
			},
			{
				"type": "Reset zoom"
			}
		],
	},
	*/
	"toolbar": {
		"enabled": false,
	}
}}
	/>
