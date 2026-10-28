import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { caregivers } from "../js/data.js";
import {
  addDaysISO,
  bookingPrice,
  filterCaregivers,
  formatDate,
  isValidISODate,
  isValidPhoneNumber,
  nextVisitStatus,
  normalizeVisitStatus,
  phoneHref,
  receiptText,
  todayInAmsterdam,
  validateBookingStep,
  validateOnboardingStep,
} from "../js/logic.js";

test("appointment price follows the approved hourly, travel and fee formula", () => {
  assert.equal(bookingPrice(22, 90), 42);
  assert.equal(bookingPrice(20, 60), 29);
  assert.equal(bookingPrice(24, 30), 21);
});

test("combined caregiver filters narrow results and can produce an empty set", () => {
  assert.deepEqual(
    filterCaregivers(caregivers, {
      service: "appointment",
      language: "German",
      neighborhood: "Oost",
    }).map((caregiver) => caregiver.id),
    ["marko"],
  );
  assert.deepEqual(
    filterCaregivers(caregivers, {
      service: "errands",
      language: "Dutch",
      neighborhood: "Zuid",
    }),
    [],
  );
});

test("Amsterdam date helpers return stable English dates", () => {
  const instant = new Date("2026-10-27T22:30:00Z");
  assert.equal(todayInAmsterdam(instant), "2026-10-27");
  assert.equal(addDaysISO("2026-10-31", 1), "2026-11-01");
  assert.equal(formatDate("2026-11-05"), "Thu, 5 Nov");
  assert.equal(isValidISODate("2026-11-05"), true);
  assert.equal(isValidISODate("2026-02-30"), false);
  assert.equal(isValidISODate("not-a-date"), false);
  assert.equal(formatDate("not-a-date"), "Choose a date");
});

test("booking validation blocks someone-else requests until consent is checked", () => {
  const base = {
    forWho: "someone",
    recipientName: "Mila Smit",
    consent: false,
    service: "appointment",
    date: "2026-10-28",
    time: "09:30",
    address: "Prinsengracht 184, Amsterdam",
    duration: 90,
    caregiverId: "ana",
  };

  assert.equal(validateBookingStep(1, base, "2026-10-27").consent !== undefined, true);
  assert.deepEqual(
    validateBookingStep(1, { ...base, consent: true }, "2026-10-27"),
    {},
  );
});

test("booking validation rejects past dates and accepts a complete future visit", () => {
  const booking = {
    forWho: "self",
    service: "appointment",
    date: "2026-10-26",
    time: "09:30",
    address: "Prinsengracht 184, Amsterdam",
    duration: 90,
    caregiverId: "ana",
  };

  assert.equal(validateBookingStep(2, booking, "2026-10-27").date !== undefined, true);
  assert.deepEqual(
    validateBookingStep(2, { ...booking, date: "2026-10-28" }, "2026-10-27"),
    {},
  );
  assert.equal(
    validateBookingStep(
      2,
      { ...booking, date: "2026-02-30" },
      "2026-10-27",
    ).date !== undefined,
    true,
  );
  assert.deepEqual(validateBookingStep(3, booking, "2026-10-27"), {});
});

test("onboarding validators require consent and a complete caregiver profile", () => {
  assert.equal(
    validateOnboardingStep(
      "family",
      2,
      { language: "Dutch", consent: false },
    ).consent !== undefined,
    true,
  );
  assert.deepEqual(
    validateOnboardingStep(
      "caregiver",
      2,
      {
        neighborhood: "Noord",
        services: ["check-in"],
        availability: ["Weekday mornings"],
      },
    ),
    {},
  );
});

test("receipt text preserves the completed-visit details and demo boundary", () => {
  const text = receiptText(
    {
      id: "visit-ana",
      recipient: "Marleen de Boer",
      date: "2026-10-23",
      total: 42,
    },
    caregivers[0],
  );
  assert.match(text, /CareNear demo receipt/);
  assert.match(text, /Sanne de Vries/);
  assert.match(text, /Total paid: €42\.00/);
  assert.match(text, /local product demo/);
});

test("visit lifecycle statuses advance only in the approved order", () => {
  assert.equal(normalizeVisitStatus("new"), "pending");
  assert.equal(normalizeVisitStatus("in-progress"), "in_progress");
  assert.equal(nextVisitStatus("pending"), "confirmed");
  assert.equal(nextVisitStatus("confirmed"), "in_progress");
  assert.equal(nextVisitStatus("in_progress"), "completed");
  assert.equal(nextVisitStatus("completed"), "completed");
});

test("trusted-contact phone values accept dialer characters and reject malformed input", () => {
  assert.equal(isValidPhoneNumber("+31 6 1234 5678"), true);
  assert.equal(isValidPhoneNumber("(020) 123-4567"), true);
  assert.equal(isValidPhoneNumber("call me"), false);
  assert.equal(isValidPhoneNumber("123"), false);
  assert.equal(phoneHref("+31 6 1234 5678"), "tel:+31612345678");
});

test("runtime copy uses English with Amsterdam locale data", () => {
  const runtime = [
    readFileSync(new URL("../index.html", import.meta.url), "utf8"),
    readFileSync(new URL("../js/app.js", import.meta.url), "utf8"),
    readFileSync(new URL("../js/data.js", import.meta.url), "utf8"),
    readFileSync(new URL("../js/logic.js", import.meta.url), "utf8"),
    readFileSync(new URL("../server.mjs", import.meta.url), "utf8"),
  ].join("\n");

  assert.match(runtime, /<html lang="en">/);
  assert.match(runtime, /Europe\/Amsterdam/);
  assert.match(runtime, /Prinsengracht 184, Amsterdam/);
  assert.doesNotMatch(
    runtime,
    /Zagreb|Croatian|Europe\/Zagreb|Trešnjevka|Maksimir|Črnomerec|Trnje|Krapinska/,
  );
  assert.doesNotMatch(
    runtime,
    /Fictief|Verder|Terug|Zoeken|Zoek|Beschikbaar|Voorbeeld|zorgverlener|aanvraag|Bezoek|Verzoek/,
  );
  assert.equal(
    caregivers.every((caregiver) => caregiver.languages.includes("Dutch")),
    true,
  );
  assert.deepEqual(
    [...new Set(caregivers.flatMap((caregiver) => caregiver.neighborhoods))],
    ["Oud-West", "Oost", "Zuid", "Noord"],
  );
});

test("deployable dist assets match the English Amsterdam source", () => {
  for (const relativePath of [
    "index.html",
    "css/styles.css",
    "js/app.js",
    "js/data.js",
    "js/logic.js",
    "assets/portrait-sources.json",
  ]) {
    assert.equal(
      readFileSync(new URL(`../dist/${relativePath}`, import.meta.url), "utf8"),
      readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8"),
      `${relativePath} is out of sync with dist`,
    );
  }
});
