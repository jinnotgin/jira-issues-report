// ==UserScript==
// @name         Jira Issue Report Exporter (SLS)
// @namespace    http://jinn.me/
// @version      0.26
// @description  https://github.com/jinnotgin/jira-issues-report
// @author       Jin
// @match        https://jira.sls.ufinity.com/secure/RapidBoard.jspa*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const generateReport = async (listOfIssues) => {
	const CONFIG = {
		SERVER_URL: "https://jira.sls.ufinity.com/",
		ESTIMATION_FIELD: "customfield_10006",
		EPIC_PREFIX: "!_",
		ESTIMATE_HIGH_LEVEL_SUFFIX: "99",
		ESTIMATE_DETAIL_LEVEL_SUFFIX: "39",
	};

	const CONSTANTS = {
		ESTIMATION_READY: `estimation-ready`,
		AC_WRITTEN: `ac-written`,
		AC_REVIEW_READY: `ac-review-ready`,
		AC_REVIEW_COMPLETE: `ac-review-complete`,
		ITD_CLARFICIATION: `itd-clarification`,
		ETD_CLARFICIATION: `etd-clarification`,
		PENDING_FIGMA: `pending-figma`,
		PENDING_DISCUSSION: `pending-discussion`,
	};

	const urls = (type) => {
		const REST_API = `${CONFIG.SERVER_URL}rest/api/latest/`;
		switch (type) {
			case "issueInfo": {
				return `${REST_API}issue/`;
			}
			default: {
				return "https://ERROR/";
			}
		}
	};

	const getIssueData = async (issueId) => {
		const statuses = {
			story: ["None", " Written", "Review In Progress", "Complete"],
			estimate: ["None", "Ballpark", "High Level", "Detail Level", "Reviewed"],
		};
		try {
			const response = await fetch(
				`${urls("issueInfo")}${issueId}?expand=changelog`
			);
			const result = await response.json();

			const { fields = {} } = result;
			const assignee =
				fields.assignee !== null ? fields.assignee.displayName : null;
			const labels = fields.labels;
			const estimate =
				fields[CONFIG.ESTIMATION_FIELD] === undefined
					? null
					: fields[CONFIG.ESTIMATION_FIELD];
			const title = fields.summary.trim();

			const isEpic = title.startsWith(CONFIG.EPIC_PREFIX);
			const isEstimationReady = labels.includes(CONSTANTS.ESTIMATION_READY);

			let storyStatusIndex;
			if (labels.includes(CONSTANTS.AC_REVIEW_COMPLETE)) storyStatusIndex = 3;
			else if (labels.includes(CONSTANTS.AC_REVIEW_READY)) storyStatusIndex = 2;
			else if (labels.includes(CONSTANTS.AC_WRITTEN)) storyStatusIndex = 1;
			else storyStatusIndex = 0;
			const storyStatus = statuses.story[storyStatusIndex];

			let estimateStatusIndex;
			if (isEpic) {
				estimateStatusIndex = 1;
			} else if (estimate === null || estimate === undefined)
				estimateStatusIndex = 0;
			else if (String(estimate).endsWith(CONFIG.ESTIMATE_HIGH_LEVEL_SUFFIX))
				estimateStatusIndex = 2;
			else if (String(estimate).endsWith(CONFIG.ESTIMATE_DETAIL_LEVEL_SUFFIX))
				estimateStatusIndex = 3;
			else estimateStatusIndex = 4;
			const estimateStatus = statuses.estimate[estimateStatusIndex];

			const pendingItems = [];
			if (
				labels.includes(CONSTANTS.ITD_CLARFICIATION) ||
				labels.includes(CONSTANTS.ETD_CLARFICIATION)
			)
				pendingItems.push("AC Clarifications");
			if (labels.includes(CONSTANTS.PENDING_FIGMA)) pendingItems.push("Figma");
			if (labels.includes(CONSTANTS.PENDING_DISCUSSION))
				pendingItems.push("Discussion");
			const pendingStatus =
				pendingItems.length === 0
					? "None"
					: `Pending ${pendingItems.join(", ")}`;

			const findKeyDates = (histories) => {
				const keyDates = {};

				const keyStatesFromLabels = [
					CONSTANTS.ESTIMATION_READY,
					CONSTANTS.AC_WRITTEN,
					CONSTANTS.AC_REVIEW_READY,
					CONSTANTS.AC_REVIEW_COMPLETE,
				];
				const keyStatesStoryPoints = {
					"estimate-high-level": (fieldData) =>
						String(fieldData.toString).endsWith(
							CONFIG.ESTIMATE_HIGH_LEVEL_SUFFIX
						),
					"estimate-detail-level": (fieldData) =>
						String(fieldData.toString).endsWith(
							CONFIG.ESTIMATE_DETAIL_LEVEL_SUFFIX
						),
					"estimate-exit-detail-level": (fieldData) => {
						const { fromString, toString } = fieldData;
						const wasDetailLevel = String(fromString).endsWith(
							CONFIG.ESTIMATE_DETAIL_LEVEL_SUFFIX
						);
						const nowIsNumber = !isNaN(parseFloat(toString));
						const nowEstimateNotHigh = !String(fieldData.toString).endsWith(
							CONFIG.ESTIMATE_HIGH_LEVEL_SUFFIX
						);
						const nowEstimateNotDetail = !String(fieldData.toString).endsWith(
							CONFIG.ESTIMATE_DETAIL_LEVEL_SUFFIX
						);
						return (
							wasDetailLevel &&
							nowIsNumber &&
							nowEstimateNotHigh &&
							nowEstimateNotDetail
						);
					},
				};
				const stateChanged = (keyword, fromState, toState) =>
					!fromState.includes(keyword) && toState.includes(keyword);
				const notFoundBefore = (stateString) =>
					typeof keyDates[stateString] === "undefined";

				for (const history of histories.reverse()) {
					const { items = [], created } = history;

					for (const changedFieldData of items) {
						if (["labels", "Story Points"].includes(changedFieldData.field)) {
							const {
								field,
								fromString = "",
								toString = "",
							} = changedFieldData;

							if (field === "labels") {
								for (const stateString of keyStatesFromLabels) {
									if (stateChanged(stateString, fromString, toString)) {
										if (notFoundBefore(stateString))
											keyDates[stateString] = created;
									}
								}
							} else if (field === "Story Points") {
								for (const [stateString, testFunc] of Object.entries(
									keyStatesStoryPoints
								)) {
									if (testFunc(changedFieldData)) {
										if (notFoundBefore(stateString))
											keyDates[stateString] = created;
									}
								}
							}
						}
					}

					if (
						keyStatesFromLabels.every(
							(stateString) => !notFoundBefore(stateString)
						) &&
						Object.keys(keyStatesStoryPoints).every(
							(stateString) => !notFoundBefore(stateString)
						)
					) {
						break; // already found all the key dates
					}
				}

				return keyDates;
			};
			const { histories = [] } = result.changelog;
			const keyDates = findKeyDates(histories);

			if (isEpic) {
				return {
					status: "OK",
					issueId,
					isEpic,
					estimate,
					title,
					assignee,
				};
			} else {
				return {
					status: "OK",
					issueId,
					isEpic,
					assignee,
					labels,
					estimate,
					title,
					isEstimationReady,
					storyStatus,
					storyStatusIndex,
					estimateStatus,
					estimateStatusIndex,
					pendingStatus,
					keyDates,
				};
			}
		} catch (e) {
			console.error(e);
			return { status: "ERROR", issueId };
		}
	};

	const getAllIssuesData = async (listOfIssueId) => {
		const issueStore = [];

		const allData = await Promise.all(
			listOfIssueId.map((issueId) => getIssueData(issueId))
		);

		// if first item is not an epic, create an epic
		if (
			allData.length > 0 &&
			allData[0].status === "OK" &&
			!allData[0].isEpic
		) {
			const EMPTY_EPIC = {
				status: "OK",
				issueId: "SLS-0000",
				isEpic: true,
				estimate: null,
				title: "Unknown",
				assignee: null,
				stories: [],
				storiesEstimate: 0,
			};
			issueStore.push(EMPTY_EPIC);
		}

		for (const data of allData) {
			if (data.isEpic) {
				issueStore.push({ ...data, stories: [], storiesEstimate: 0 });
			} else {
				const LATEST_EPIC = issueStore[issueStore.length - 1];

				LATEST_EPIC.stories.push(data);
				LATEST_EPIC.storiesEstimate += data.estimate;
			}
		}
		return issueStore;
	};

	const reportData = await getAllIssuesData(listOfIssues);
	const reportExport = {
		status: "OK",
		data: reportData,
		generatedDateTime: new Date().toISOString(),
	};

	await navigator.clipboard.writeText(JSON.stringify(reportExport));
	alert("Report data copied!");

	return reportExport;
};

/*
var listofIssues = [...document.querySelectorAll('div.ghx-selected .js-key-link')].map(item => item.textContent);
generateReport(listofIssues).then((data) => {
  console.log(data)
});
*/

const prepare = () => {
	"use strict";

	const createElements = () => {
		if (document.querySelectorAll("#generateReportButton").length === 1)
			return false;

		const generateReportButton = document.createElement("button");
		generateReportButton.id = "generateReportButton";
		generateReportButton.textContent = "Generate Report";
		const generateReportButton_onclick = async () => {
			const queryString = "div.js-issue.ghx-selected .js-key-link";
			const selectedStoriesIds = [
				...document.querySelectorAll(queryString),
			].map((item) => item.textContent.trim());
			generateReport(selectedStoriesIds);
		};
		generateReportButton.onclick = generateReportButton_onclick;
		document
			.querySelector("#ghx-view-presentation")
			.prepend(generateReportButton);
	};

	window.addEventListener("load", createElements, false);
	setTimeout(createElements, 1000);
};

prepare();
