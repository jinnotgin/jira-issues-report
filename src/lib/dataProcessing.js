import CONSTANTS from "./constants.js";
import { getDesignSignOffRange } from "./utils.js";

const filterFunctions = {
  pendingDiscussion: (item) =>
    item.labels.includes(CONSTANTS.PENDING_DISCUSSION),
  pendingFigma: (item) => item.labels.includes(CONSTANTS.PENDING_FIGMA),
  pendingAcClarifications: (item) =>
    item.labels.includes(CONSTANTS.ITD_CLARFICIATION) ||
    item.labels.includes(CONSTANTS.ETD_CLARFICIATION),
  storyIncomplete: (item) => item.storyStatusIndex === 0,
  storyWritten: (item) => item.storyStatusIndex === 1,
  storyReview: (item) => item.storyStatusIndex === 2,
  storyDone: (item) => item.storyStatusIndex === 3,
  estimateIncomplete: (item) => item.estimateStatusIndex === 0,
  estimateHigh: (item) => item.estimateStatusIndex === 2,
  estimateDetail: (item) => item.estimateStatusIndex === 3,
  estimateDone: (item) => item.estimateStatusIndex === 4,
  storyPeerReviewIncomplete: (item) =>
    !item.labels.includes(CONSTANTS.PEER_REVIEW_1)
};

export default (reportData, activeFilters) => {
  const filteredReportData = [];
  const aggregations = {
    epicsStatus: reportData.map((epic) => {
      return {
        minStoryStatusIndex: Math.min(
          ...epic.stories.map((item) => item.storyStatusIndex)
        ),
        minEstimateStatusIndex: Math.min(
          ...epic.stories.map((item) => item.estimateStatusIndex)
        )
      };
    }),
    completion: {
      storyCount: {
        writing: [0, 0, 0, 0], // not done, written, review, done
        estimation: [0, 0, 0, 0, 0] // not done, ballpark, high, detail, done
      },
      storyPoints: {
        writing: [0, 0, 0, 0], // not done, written, review, done
        estimation: [0, 0, 0, 0, 0] // not done, ballpark, high, detail, done
      }
    },
    total: {
      storyCount: 0,
      storyPoints: 0
    }
  };
  const keyDates = {
    // "estimation-ready": [],
    "ac-written": [],
    "estimate-detail-level": [],
    "ac-review-ready": [],
    "ac-review-complete": [],
    "ux-signoff-start": [],
    "ux-signoff-end": []
  };
  const estimateFinalised = [];

  for (const epic of reportData) {
    // get UI UX sign off data
    const [uxSignOff_start, uxSignOff_end] = getDesignSignOffRange(epic.title);

    const filteredStories = [];

    const storiesEstimated = epic.storiesEstimate > 0;
    if (!storiesEstimated) {
      aggregations.total.storyPoints += epic.estimate;
    }

    for (const storyItem of epic.stories) {
      // completion aggregation for Writing and Estimation using count/points
      aggregations.total.storyCount += 1;
      aggregations.completion.storyCount.writing[
        storyItem.storyStatusIndex
      ] += 1;
      aggregations.completion.storyCount.estimation[
        storyItem.estimateStatusIndex
      ] += 1;

      if (storiesEstimated) {
        aggregations.total.storyPoints += storyItem.estimate;
        aggregations.completion.storyPoints.writing[
          storyItem.storyStatusIndex
        ] += storyItem.estimate;
        aggregations.completion.storyPoints.estimation[
          storyItem.estimateStatusIndex
        ] += storyItem.estimate;
      }

      // add keydates into burndown chart data
      for (const [type, isoDateTime] of Object.entries(storyItem.keyDates)) {
        if (!Object.keys(keyDates).includes(type)) continue;

        keyDates[type].push({
          unixTime: new Date(isoDateTime).getTime(),
          estimate: storyItem.estimate
        });
      }

      // incoprate UI UX sign off into keyDates
      if (!!uxSignOff_start) {
        keyDates["ux-signoff-start"].push({
          unixTime: new Date(uxSignOff_start).getTime(),
          estimate: storyItem.estimate
        });
      }
      if (!!uxSignOff_end) {
        keyDates["ux-signoff-end"].push({
          unixTime: new Date(uxSignOff_end).getTime(),
          estimate: storyItem.estimate
        });
      }

      // NOTE: We need to make sure "estimateFinalised" is a "true" one
      // the team reuses story IDs, there may be past instances of "estimateFinalised" that is no longer relevant
      // hence, we will check the "estimateFinalised"'s validity first
      if (
        storyItem.estimateStatusIndex === 4 &&
        Object.keys(storyItem.keyDates).includes(
          CONSTANTS.ESTIMATE_EXIT_DETAIL_LEVEL
        ) &&
        Object.keys(storyItem.keyDates).includes(
          CONSTANTS.ESTIMATE_DETAIL_LEVEL
        ) &&
        new Date(storyItem.keyDates[CONSTANTS.ESTIMATE_EXIT_DETAIL_LEVEL]) >=
          new Date(storyItem.keyDates[CONSTANTS.ESTIMATE_DETAIL_LEVEL])
      ) {
        const isoDateTime =
          storyItem.keyDates[CONSTANTS.ESTIMATE_EXIT_DETAIL_LEVEL];
        estimateFinalised.push({
          unixTime: new Date(isoDateTime).getTime(),
          estimate: storyItem.estimate
        });
      }

      // check if story passes filters, if any
      if (activeFilters.length === 0) filteredStories.push(storyItem);
      else {
        const storyPassesFilters = activeFilters
          .map((id) => filterFunctions[id](storyItem))
          .some((item) => item === true);

        if (storyPassesFilters) {
          filteredStories.push(storyItem);
        }
      }
    }
    if (activeFilters.length === 0 || filteredStories.length > 0) {
      const filteredEpic = { ...epic, stories: filteredStories };
      filteredReportData.push(filteredEpic);
    }
  }

  // incorporate all "estimateFinalised" into keyDates (not working yet)
  keyDates["estimate-finalised"] = estimateFinalised;
  console.log({ estimateFinalised });

  // generate burn-up chart data
  const burnupChartData = [];
  for (const [type, instances] of Object.entries(keyDates)) {
    // add today as an empty data point
    // this is so that the graph will draw until today
    instances.push({
      estimate: 0,
      unixTime: new Date()
    });

    // sort all data points into chronological order
    instances.sort((a, b) => a.unixTime - b.unixTime);

    let runningTotal = 0;
    const friendlyNames = {
      // "estimation-ready": "Solution Agreed",
      "ac-written": "Story Written",
      "estimate-detail-level": "Estimate Sent",
      "ac-review-ready": "Story Sent",
      "estimate-finalised": "Estimate Reviewed",
      "ac-review-complete": "Story Reviewed",
      "ux-signoff-start": "UX Signoff Start",
      "ux-signoff-end": "UX Signoff End"
    };
    for (const { estimate, unixTime } of instances) {
      runningTotal += estimate;
      burnupChartData.push({
        group: friendlyNames[type],
        date: new Date(unixTime).toISOString(),
        runningTotal
      });
    }
  }
  console.log({
    filteredReportData,
    aggregations,
    burnupChartData
  });
  return {
    filteredReportData,
    aggregations,
    burnupChartData
  };
};
