export const displayStr = (data) =>
  data === null || data === undefined ? "-" : String(data);

export const statusesIndexMap = {
  story: [null, "Written", "Review", "Done"],
  estimate: [null, null, "High", "Detail", "Done"]
};

export const ISOStringToDateString = (isoString) =>
  new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

export const percentageString = (number) =>
  number.toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 2
  });

export const decimalString = (number) =>
  number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export const addDaysToDate = (date, days) => {
  const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
  return new Date(new Date(date).getTime() + days * MILLISECONDS_IN_A_DAY);
};

export const JIRA_BROWSE_URL = "https://jira.sls.ufinity.com/browse/";

export const isSetDateInput = (input) =>
  typeof input === "string" && input !== "";
export const isSetNumberInput = (input) => typeof input === "number";

export const getDesignSignOffRange = (input) => {
  const stringToDate = (input) => {
    let [day, month, year] = input.trim().split("/");

    year = parseInt(year, 10);
    if (year >= 0 && year < 100) {
      const now = new Date();
      const fullYear = now.getFullYear();
      let shortYear = fullYear % 100;
      let m1 = fullYear - shortYear;
      let m2 = m1 - 100;

      let opt1 = year + m1;
      let opt2 = year + m2;

      year =
        Math.abs(fullYear - opt1) < Math.abs(fullYear - opt2) ? opt1 : opt2;
    }
    const isoString = `${year}-${month}-${day}`;
    return new Date(isoString);
  };

  const regex_twoDates = /\d{1,2}\/\d{1,2}\/\d{2,4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{2,4}(?=])/;
  const test_twoDates = input.match(regex_twoDates);
  if (test_twoDates !== null && test_twoDates.length === 1)
    return test_twoDates[0].split("-").map((item) => stringToDate(item));

  const regex_oneEndDate = /\d{1,2}\/\d{1,2}\/\d{2,4}(?=])/;
  const test_oneEndDate = input.match(regex_oneEndDate);
  if (test_oneEndDate !== null && test_oneEndDate.length === 1) {
    const date = stringToDate(test_oneEndDate[0]);
    return [date, date];
  }

  const regex_oneStartDate = /\d{1,2}\/\d{1,2}\/\d{2,4}(?= *-)/;
  const test_oneStartDate = input.match(regex_oneStartDate);
  if (test_oneStartDate !== null && test_oneStartDate.length === 1) {
    const date = stringToDate(test_oneStartDate[0]);
    return [date, null];
  }

  return [null, null];
};

// not used
// adapted from https://stackoverflow.com/a/175787
/*
export const isNumericString = (str) => {
  if (typeof str !== "string") return false; // we only process strings!
  const check1 = !isNaN(str); // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
  const check2 = !isNaN(parseFloat(str)); // ...and ensure strings of whitespace fail
  return check1 && check2;
};
*/
