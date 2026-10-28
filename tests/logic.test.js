import test from "node:test";
import assert from "node:assert/strict";
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
  todayInZagreb,
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
      neighborhood: "Maksimir",
    }).map((caregiver) => caregiver.id),
    ["marko"],
  );
  assert.deepEqual(
    filterCaregivers(caregivers, {
      service: "errands",
      language: "Croatian",
      neighborhood: "Črnomerec",
    }),
    [],
  );
});

test("Zagreb date helpers return stable ISO dates independent of host zone formatting", () => {
  const instant = new Date("2026-10-27T22:30:00Z");
  assert.equal(todayInZagreb(instant), "2026-10-27");
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
    recipientName: "Mara Kralj",
    consent: false,
    service: "appointment",
    date: "2026-10-28",
    time: "09:30",
    address: "Krapinska 18, Zagreb",
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
    address: "Krapinska 18, Zagreb",
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
      { language: "Croatian", consent: false },
    ).consent !== undefined,
    true,
  );
  assert.deepEqual(
    validateOnboardingStep(
      "caregiver",
      2,
      {
        neighborhood: "Trnje",
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
      recipient: "Margaret Novak",
      date: "2026-10-23",
      total: 42,
    },
    caregivers[0],
  );
  assert.match(text, /CareNear demo receipt/);
  assert.match(text, /Ana Horvat/);
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
  assert.equal(isValidPhoneNumber("+385 91 234 5678"), true);
  assert.equal(isValidPhoneNumber("(091) 234-567"), true);
  assert.equal(isValidPhoneNumber("call me"), false);
  assert.equal(isValidPhoneNumber("123"), false);
  assert.equal(phoneHref("+385 91 234 5678"), "tel:+385912345678");
});
