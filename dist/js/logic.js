export const TRAVEL_FEE = 4;
export const SERVICE_FEE = 5;
export const VISIT_STATE_ORDER = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
];

export function bookingPrice(rate, duration) {
  return (rate * duration) / 60 + TRAVEL_FEE + SERVICE_FEE;
}

export function filterCaregivers(caregivers, filters = {}) {
  const service = filters.service ?? "all";
  const language = filters.language ?? "all";
  const neighborhood = filters.neighborhood ?? "all";

  return caregivers.filter(
    (caregiver) =>
      (service === "all" || caregiver.services.includes(service)) &&
      (language === "all" || caregiver.languages.includes(language)) &&
      (neighborhood === "all" ||
        caregiver.neighborhoods.includes(neighborhood)),
  );
}

export function normalizeVisitStatus(status) {
  const aliases = {
    new: "pending",
    awaiting: "pending",
    "in-progress": "in_progress",
    done: "completed",
  };
  const normalized = aliases[status] ?? status;
  return VISIT_STATE_ORDER.includes(normalized) ? normalized : "pending";
}

export function nextVisitStatus(status) {
  const index = VISIT_STATE_ORDER.indexOf(normalizeVisitStatus(status));
  return VISIT_STATE_ORDER[Math.min(index + 1, VISIT_STATE_ORDER.length - 1)];
}

export function isValidPhoneNumber(value) {
  if (typeof value !== "string" || !/^\+?[0-9()\-\s]+$/.test(value.trim())) {
    return false;
  }
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15;
}

export function phoneHref(value) {
  return isValidPhoneNumber(value)
    ? `tel:${value.trim().replace(/[()\s-]/g, "")}`
    : "";
}

export function todayInAmsterdam(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type) => parts.find((part) => part.type === type)?.value;
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function addDaysISO(dateISO, amount) {
  const date = new Date(`${dateISO}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function isValidISODate(dateISO) {
  if (
    typeof dateISO !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)
  ) {
    return false;
  }
  const date = new Date(`${dateISO}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateISO
  );
}

export function formatDate(dateISO, options = {}) {
  if (!isValidISODate(dateISO)) return "Choose a date";
  const date = new Date(`${dateISO}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: options.weekday ?? "short",
    day: "numeric",
    month: options.month ?? "short",
    ...(options.year ? { year: "numeric" } : {}),
  }).formatToParts(date);
  const read = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("weekday")}, ${read("day")} ${read("month")}${options.year ? ` ${read("year")}` : ""}`;
}

export function validateBookingStep(step, state, today = todayInAmsterdam()) {
  const errors = {};

  if (step === 1) {
    if (state.forWho === "someone") {
      if (!state.recipientName?.trim()) {
        errors.recipientName = "Enter the name of the person receiving the visit.";
      }
      if (!state.consent) {
        errors.consent =
          "Confirm that the person receiving care has given permission for this request.";
      }
    } else if (!state.forWho) {
      errors.forWho = "Choose who this visit is for.";
    }
    if (!state.service) {
      errors.service = "Choose the kind of help needed.";
    }
  }

  if (step === 2) {
    if (!isValidISODate(state.date) || state.date < today) {
      errors.date = "Choose an available future date.";
    }
    if (!state.time) {
      errors.time = "Choose a start time.";
    }
    if (!state.address?.trim()) {
      errors.address = "Enter the visit address.";
    }
    if (![30, 60, 90, 120].includes(Number(state.duration))) {
      errors.duration = "Choose a visit length.";
    }
  }

  if (step === 3 && !state.caregiverId) {
    errors.caregiverId = "Choose a caregiver for this request.";
  }

  return errors;
}

export function validateOnboardingStep(kind, step, state) {
  const errors = {};

  if (kind === "family") {
    if (step === 1) {
      if (!state.relationship) errors.relationship = "Choose who needs help.";
      if (!state.services?.length) errors.services = "Choose at least one service.";
    }
    if (step === 2) {
      if (!state.language) errors.language = "Choose a preferred language.";
      if (!state.consent) {
        errors.consent = "Consent is required before continuing.";
      }
    }
  }

  if (kind === "caregiver") {
    if (step === 1) {
      if (!state.experience?.trim()) {
        errors.experience = "Tell us briefly about your experience.";
      }
      if (!state.languages?.length) {
        errors.languages = "Choose at least one language.";
      }
    }
    if (step === 2) {
      if (!state.neighborhood) errors.neighborhood = "Choose your main area.";
      if (!state.services?.length) errors.services = "Choose at least one service.";
      if (!state.availability?.length) {
        errors.availability = "Choose at least one availability period.";
      }
    }
  }

  return errors;
}

export function receiptText(visit, caregiver) {
  return [
    "CareNear demo receipt",
    "Fictional illustrative data",
    "",
    `Visit: ${visit.recipient}`,
    `Caregiver: ${caregiver.name}`,
    `Date: ${formatDate(visit.date, { year: true })}`,
    `Reference: ${visit.id}`,
    "",
    "Appointment support",
    `Total paid: €${visit.total.toFixed(2)}`,
    "Transport: paid separately",
    "",
    "This receipt is part of a local product demo.",
  ].join("\n");
}
