export const services = [
  {
    id: "appointment",
    name: "Appointment support",
    short: "Prepare, go along, return home",
    description:
      "Getting ready, travelling together, waiting and a calm return home.",
    icon: "calendar",
  },
  {
    id: "errands",
    name: "Errands",
    short: "Shopping and everyday tasks",
    description:
      "Shopping and other practical tasks you agree on in advance.",
    icon: "shopping",
  },
  {
    id: "check-in",
    name: "Home check-ins",
    short: "Company and light help",
    description:
      "Short visits for company, a warm meal and non-clinical help.",
    icon: "home",
  },
  {
    id: "nursing",
    name: "Nursing visits",
    short: "Informational in this demo",
    description:
      "Licensed nurse visits for services we have checked and enabled.",
    icon: "heart",
    unavailable: true,
  },
];

export const caregivers = [
  {
    id: "ana",
    name: "Sanne de Vries",
    role: "Caregiver",
    rate: 22,
    experience: 6,
    languages: ["Dutch", "English"],
    neighborhoods: ["Oud-West"],
    services: ["appointment", "errands", "check-in"],
    checks: ["ID checked", "References checked", "First-aid certificate"],
    bio: "Patient, practical support for appointments and everyday routines.",
    detail:
      "Sanne has supported Amsterdam families with hospital visits, errands and regular home check-ins for six years. She is calm with stairs, public transport and changing appointment schedules.",
    initials: "SD",
    portrait: "assets/portrait-ana.jpg",
    portraitAlt:
      "Stock portrait representing fictional caregiver Sanne de Vries",
    rating: 4.9,
    reviewCount: 34,
    nextAvailability: "Tomorrow, 09:30",
    mapPosition: { x: 28, y: 64 },
    color: "coral",
    portraitSource: {
      photographer: "Brooke Balentine",
      page: "https://unsplash.com/photos/cdZcNIca4w0",
      license: "https://unsplash.com/license",
    },
  },
  {
    id: "marko",
    name: "Daan van Dijk",
    role: "Caregiver",
    rate: 20,
    experience: 3,
    languages: ["Dutch", "English", "German"],
    neighborhoods: ["Oost"],
    services: ["appointment", "errands", "check-in"],
    checks: ["ID checked", "References checked"],
    bio: "Warm company, errands and reliable accompaniment.",
    detail:
      "Daan is an easy-going companion for shopping, walks and appointments. Families often ask him for regular weekday support.",
    initials: "DD",
    portrait: "assets/portrait-marko.jpg",
    portraitAlt:
      "Stock portrait representing fictional caregiver Daan van Dijk",
    rating: 4.8,
    reviewCount: 21,
    nextAvailability: "Thu, 29 Oct · 14:00",
    mapPosition: { x: 71, y: 31 },
    color: "sunflower",
    portraitSource: {
      photographer: "Vitaly Gariev",
      page: "https://unsplash.com/photos/k3pW97tvVPs",
      license: "https://unsplash.com/license",
    },
  },
  {
    id: "ivana",
    name: "Lotte Jansen",
    role: "Caregiver",
    rate: 24,
    experience: 9,
    languages: ["Dutch"],
    neighborhoods: ["Zuid"],
    services: ["appointment", "check-in"],
    checks: ["ID checked", "References checked", "First-aid certificate"],
    bio: "Experienced support centred on dignity and independence.",
    detail:
      "Lotte has nine years of experience supporting older adults at home. She plans visits around a person's own routines and keeps family updates clear and concise.",
    initials: "LJ",
    portrait: "assets/portrait-ivana.jpg",
    portraitAlt:
      "Stock portrait representing fictional caregiver Lotte Jansen",
    rating: 5.0,
    reviewCount: 46,
    nextAvailability: "Fri, 30 Oct · 11:00",
    mapPosition: { x: 40, y: 20 },
    color: "teal",
    portraitSource: {
      photographer: "Vitaly Gariev",
      page: "https://unsplash.com/photos/gSSr-hVwOxU",
      license: "https://unsplash.com/license",
    },
  },
  {
    id: "petra",
    name: "Noor El Amrani",
    role: "Caregiver",
    rate: 23,
    experience: 4,
    languages: ["Dutch", "English", "Arabic"],
    neighborhoods: ["Noord"],
    services: ["errands", "check-in"],
    checks: ["ID checked", "References checked"],
    bio: "Friendly local help with errands and time at home.",
    detail:
      "Noor helps with grocery lists, neighbourhood errands and unhurried company at home. She offers weekday mornings and Saturday afternoons.",
    initials: "NE",
    portrait: "assets/portrait-petra.jpg",
    portraitAlt:
      "Stock portrait representing fictional caregiver Noor El Amrani",
    rating: 4.7,
    reviewCount: 18,
    nextAvailability: "Sat, 31 Oct · 10:00",
    mapPosition: { x: 59, y: 71 },
    color: "mint",
    portraitSource: {
      photographer: "İsmail Efe Top",
      page: "https://unsplash.com/photos/qzMjpuILjWQ",
      license: "https://unsplash.com/license",
    },
  },
];

export const testimonial = {
  quote:
    "Knowing someone could check in, wait with Mum at an appointment and then tell us what happened made a difficult week feel much lighter.",
  name: "Eva",
  persona: "Illustrative family member, Amsterdam",
};

export const visitLifecycle = [
  {
    status: "pending",
    label: "Pending",
    nextAction: "Waiting for the caregiver to reply.",
    message:
      "Your request has been sent. CareNear will show a confirmed visit here only if the caregiver accepts it.",
    timeline: [
      ["Request sent", "Today, 10:12"],
      ["Caregiver reply", "Pending"],
    ],
  },
  {
    status: "confirmed",
    label: "Confirmed",
    nextAction: "Your visit is scheduled. No payment was taken in this demo.",
    message:
      "Sanne and the requested time are confirmed in this illustrative lifecycle.",
    timeline: [
      ["Request sent", "Today, 10:12"],
      ["Caregiver accepted", "Today, 10:36"],
      ["Visit confirmed", "Today, 10:37"],
    ],
  },
  {
    status: "in_progress",
    label: "In progress",
    nextAction: "The visit is happening now. Updates appear here.",
    message:
      "Sanne arrived at 09:28 and the visit started at 09:30. Family updates remain intentionally brief.",
    timeline: [
      ["Arrived", "09:28"],
      ["Visit started", "09:30"],
      ["Next update", "After the remaining task"],
    ],
  },
  {
    status: "completed",
    label: "Completed",
    nextAction: "The visit is complete. Read the summary or download the receipt.",
    message:
      "The local demo visit completed at 11:02. The fictional summary and receipt are ready below.",
    timeline: [
      ["Arrived", "09:28"],
      ["Visit started", "09:30"],
      ["Completed", "11:02"],
    ],
  },
];

export const sampleRequests = [
  {
    id: "req-appointment",
    service: "appointment",
    date: "2026-11-05",
    time: "09:30",
    duration: 90,
    neighborhood: "Oud-West",
    recipient: "Marleen de Boer",
    replyWindow: "2 h",
    language: "Dutch",
    accessibility: "Uses a walking frame; stairs are slow",
    instructions:
      "Help Marleen prepare, go with her to the cardiology clinic and bring her home. Her daughter will confirm the taxi.",
    status: "new",
  },
  {
    id: "req-errands",
    service: "errands",
    date: "2026-11-06",
    time: "14:00",
    duration: 60,
    neighborhood: "Oost",
    recipient: "Wim Bakker",
    replyWindow: "5 h",
    language: "Dutch",
    accessibility: "No mobility support needed",
    instructions:
      "Collect a prescription and a short shopping list. Please call on arrival.",
    status: "new",
  },
  {
    id: "req-checkin",
    service: "check-in",
    date: "2026-11-07",
    time: "10:00",
    duration: 30,
    neighborhood: "Zuid",
    recipient: "Els de Groot",
    replyWindow: "1 day",
    language: "Dutch",
    accessibility: "Prefers a quiet visit at home",
    instructions:
      "A short social visit and help preparing a simple lunch.",
    status: "new",
  },
];

export const pastVisit = {
  id: "visit-ana",
  caregiverId: "ana",
  service: "appointment",
  date: "2026-10-23",
  recipient: "Marleen de Boer",
  tasks: [
    "Helped Marleen get ready and leave the house",
    "Accompanied her to the cardiology clinic and waited with her",
    "Took her home and made sure she had lunch",
  ],
  observations:
    "Marleen was in good spirits. She tired on the stairs at the clinic, so she rested on each landing.",
  followUp:
    "The doctor asked for a repeat blood test in two weeks. Would you like Sanne to book a visit for that?",
  timeline: [
    ["Arrived", "09:28"],
    ["Visit started", "09:30"],
    ["Completed", "11:02"],
  ],
  total: 42,
};

export const serviceLabel = (id) =>
  services.find((service) => service.id === id)?.name ?? "Visit";

export const caregiverById = (id) =>
  caregivers.find((caregiver) => caregiver.id === id);
