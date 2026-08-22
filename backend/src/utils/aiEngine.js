const { GoogleGenerativeAI } = require('@google/generative-ai');
const Disease = require('../models/Disease');
const Medicine = require('../models/Medicine');
const { AI_PROVIDER, GEMINI_API_KEY, GEMINI_MODEL } = require('../config/env');

const DISCLAIMER =
  '\n\n_Disclaimer: I am an AI assistant, not a doctor. This is general educational ' +
  'information only — please consult a qualified healthcare professional for advice ' +
  'about your own health._';

// Anything on this list short-circuits every other branch, before any model runs.
const EMERGENCY_KEYWORDS = [
  'chest pain', 'severe bleeding', 'heavy bleeding', 'stroke', 'heart attack',
  'cannot breathe', "can't breathe", 'cant breathe', 'difficulty breathing',
  'unconscious', 'seizure', 'suicide', 'kill myself', 'overdose',
  'coughing blood', 'vomiting blood', 'slurred speech', 'paralysis',
];

const EMERGENCY_REPLY =
  '**This may be a medical emergency.**\n\n' +
  'Please stop using this app and get help immediately:\n' +
  '- Call your local emergency number (**112** in India, **911** in the US)\n' +
  '- Or go to the nearest emergency room now\n\n' +
  'If someone is with you, tell them what you are feeling right away. ' +
  'Do not wait to see if it passes.';

// ──────────────────────────────────────────────
// Intent detection
// ──────────────────────────────────────────────

const INTENT_PATTERNS = {
  greeting: /^\s*(hi|hello|hey|good (morning|afternoon|evening)|namaste)\b/i,
  medicine: /\b(medicine|medication|drug|tablet|capsule|syrup|dose|dosage|side effect|antibiotic|prescription)\b/i,
  symptom: /\b(i have|i feel|i am having|suffering from|experiencing|pain|ache|fever|cough|cold|nausea|dizzy|rash|swelling)\b/i,
  disease: /\b(disease|condition|illness|what is|tell me about|symptoms? of|causes? of|treatment for|cure for)\b/i,
  booking: /\b(book|appointment|schedule|doctor|consult|visit|available|slot)\b/i,
  report: /\b(report|upload|analysis|lab|blood test|result|pdf)\b/i,
};

const detectIntent = (message) => {
  // Order matters: greeting is checked first so "hi" never routes as a symptom.
  for (const intent of ['greeting', 'medicine', 'symptom', 'disease', 'booking', 'report']) {
    if (INTENT_PATTERNS[intent].test(message)) return intent;
  }
  return 'unknown';
};

// Filler words that would otherwise match every catalog entry.
const STOPWORDS = new Set([
  'what', 'is', 'are', 'the', 'a', 'an', 'of', 'for', 'to', 'do', 'does', 'i',
  'my', 'me', 'have', 'has', 'had', 'and', 'or', 'in', 'on', 'about', 'tell',
  'can', 'you', 'how', 'why', 'when', 'should', 'take', 'am', 'feel', 'feeling',
  'having', 'been', 'with', 'this', 'that', 'it', 'be', 'get', 'got', 'from',
  'any', 'some', 'there', 'was', 'were', 'will', 'would', 'could', 'much',
]);

const keywords = (message) =>
  message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

// Escape user input before it becomes a RegExp — otherwise a stray "(" or "*"
// throws and takes the whole reply down.
const escapeRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ──────────────────────────────────────────────
// Tier 1 — catalog-grounded handlers
// Each returns { reply, suggestions } or null when it finds nothing, letting
// the caller fall through to the next strategy.
// ──────────────────────────────────────────────

const handleMedicine = async (message) => {
  const words = keywords(message);
  if (!words.length) return null;

  const exact = words.map((w) => new RegExp(`^${escapeRx(w)}$`, 'i'));
  const loose = words.map(escapeRx).join('|');

  const medicine = await Medicine.findOne({
    isActive: { $ne: false },
    $or: [
      { name: { $in: exact } },
      { genericName: { $in: exact } },
      { name: { $regex: loose, $options: 'i' } },
      { genericName: { $regex: loose, $options: 'i' } },
    ],
  }).select('name slug genericName summary uses dosage sideEffects prescriptionRequired');

  if (!medicine) return null;

  const parts = [`**${medicine.name}** (${medicine.genericName})`, '', medicine.summary];

  if (medicine.uses?.length) {
    parts.push('', `**Commonly used for:** ${medicine.uses.slice(0, 5).join(', ')}`);
  }
  if (medicine.dosage?.adult) {
    parts.push('', `**Typical adult dose:** ${medicine.dosage.adult}`);
  }
  if (medicine.sideEffects?.common?.length) {
    parts.push('', `**Common side effects:** ${medicine.sideEffects.common.slice(0, 5).join(', ')}`);
  }

  parts.push(
    '',
    medicine.prescriptionRequired
      ? 'This medicine needs a prescription — please see a doctor before taking it.'
      : 'This is available over the counter, but still follow the label and dosage.'
  );
  parts.push('', `Full details: /medicines/${medicine.slug}`);

  return {
    reply: parts.join('\n'),
    suggestions: [
      `What are the side effects of ${medicine.name}?`,
      'Find a doctor to consult',
      'Browse all medicines',
    ],
  };
};

const handleSymptom = async (message) => {
  const words = keywords(message);
  if (!words.length) return null;

  // Same matching approach as POST /api/ai/symptom-check, so the assistant and
  // the symptom checker never contradict each other.
  const diseases = await Disease.find({
    symptoms: { $elemMatch: { $in: words.map((w) => new RegExp(escapeRx(w), 'i')) } },
  }).select('name slug category severity specialistType symptoms');

  if (!diseases.length) return null;

  const scored = diseases
    .map((d) => {
      const matched = (d.symptoms || []).filter((s) =>
        words.some((w) => s.toLowerCase().includes(w) || w.includes(s.toLowerCase()))
      );
      const total = d.symptoms?.length || 1;
      return { disease: d, matched, score: Math.round((matched.length / total) * 100) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const lines = [
    'Based on what you described, these conditions in our catalog involve similar symptoms:',
    '',
  ];

  scored.forEach(({ disease, matched, score }) => {
    lines.push(
      `**${disease.name}** — ${score}% symptom overlap (${disease.severity})`,
      `  Matched: ${matched.join(', ')}`,
      `  Usually seen by: ${disease.specialistType}`,
      `  Read more: /diseases/${disease.slug}`,
      ''
    );
  });

  lines.push(
    'This is a similarity match against a reference catalog — **not a diagnosis**. ' +
      'For anything persistent, worsening, or worrying, please book an appointment.'
  );

  return {
    reply: lines.join('\n'),
    suggestions: [
      `Book a ${scored[0].disease.specialistType}`,
      'Run the full Symptom Checker',
      `Tell me more about ${scored[0].disease.name}`,
    ],
  };
};

const handleDisease = async (message) => {
  const words = keywords(message);
  if (!words.length) return null;

  const exact = words.map((w) => new RegExp(`^${escapeRx(w)}$`, 'i'));
  const loose = words.map(escapeRx).join('|');

  const disease = await Disease.findOne({
    $or: [{ name: { $in: exact } }, { name: { $regex: loose, $options: 'i' } }],
  }).select('name slug description category severity symptoms causes preventions specialistType');

  if (!disease) return null;

  const parts = [
    `**${disease.name}** (${disease.category}, ${disease.severity})`,
    '',
    disease.description,
  ];

  if (disease.symptoms?.length) {
    parts.push('', `**Common symptoms:** ${disease.symptoms.slice(0, 6).join(', ')}`);
  }
  if (disease.causes?.length) {
    parts.push('', `**Common causes:** ${disease.causes.slice(0, 4).join(', ')}`);
  }
  if (disease.preventions?.length) {
    parts.push('', `**Prevention:** ${disease.preventions.slice(0, 4).join(', ')}`);
  }

  parts.push('', `**Specialist:** ${disease.specialistType}`, `Full page: /diseases/${disease.slug}`);

  return {
    reply: parts.join('\n'),
    suggestions: [
      `Book a ${disease.specialistType}`,
      `What medicines treat ${disease.name}?`,
      'Browse all conditions',
    ],
  };
};

// Navigation intents are canned help — no catalog lookup needed.
const NAVIGATION_REPLIES = {
  booking: {
    reply:
      'To book an appointment:\n\n' +
      '1. Go to **Find Doctors** (/doctors) and filter by specialization\n' +
      '2. Open a profile and pick an available date\n' +
      '3. Choose a free time slot and confirm\n\n' +
      'Everything you have booked lives under **My Appointments** (/my-appointments), ' +
      'where you can also reschedule or cancel.',
    suggestions: [
      'Show me available doctors',
      'How do I cancel an appointment?',
      'What does a consultation cost?',
    ],
  },
  report: {
    reply:
      'To get a medical report analysed:\n\n' +
      '1. Go to **Upload Report** (/upload)\n' +
      '2. Upload a PDF or image of your lab report (max 10MB)\n' +
      '3. We extract the lab values and flag anything outside the normal range\n\n' +
      'Analysis runs in the background — the report shows as *processing*, then ' +
      '*analyzed*, usually within a minute. Only you and doctors you have an ' +
      'appointment with can ever see it.',
    suggestions: [
      'What file types can I upload?',
      'Who can see my reports?',
      'Book a doctor to review my report',
    ],
  },
  greeting: {
    reply:
      'Hello! I can help you with:\n\n' +
      '- Understanding **symptoms** and what conditions involve them\n' +
      '- Looking up **medicines** — uses, dosage, side effects\n' +
      '- Learning about a **condition** or disease\n' +
      '- Finding your way around — booking doctors, uploading reports\n\n' +
      'What would you like to know?',
    suggestions: [
      'I have a headache and fever',
      'Tell me about diabetes',
      'How do I book an appointment?',
    ],
  },
};

const FALLBACK = {
  reply:
    'I could not find that in our medical catalog, and I am not able to diagnose ' +
    'or give personal medical advice.\n\n' +
    'Things I can help with:\n' +
    '- Describe your symptoms and I will show related conditions\n' +
    '- Ask about a specific medicine or condition by name\n' +
    '- Ask how to book a doctor or upload a report\n\n' +
    'For anything about your own health, please book an appointment with a doctor.',
  suggestions: ['Browse all conditions', 'Browse all medicines', 'Find a doctor'],
};

// Which handlers to try, in order, for each intent. A medicine-flavoured
// question like "what should I take for a headache" often answers better from
// the disease side, so every intent falls through the full set.
const HANDLER_ORDER = {
  medicine: [handleMedicine, handleDisease, handleSymptom],
  symptom: [handleSymptom, handleDisease, handleMedicine],
  disease: [handleDisease, handleSymptom, handleMedicine],
  unknown: [handleDisease, handleSymptom, handleMedicine],
};

/**
 * Tier 1 — deterministic, grounded in our own collections. No external calls,
 * no API key, no rate limit. This is the default engine, the source of the
 * suggestion chips, and the fallback for every Tier 2 failure mode.
 */
const rulesEngine = async (message) => {
  const intent = detectIntent(message);

  if (NAVIGATION_REPLIES[intent]) return NAVIGATION_REPLIES[intent];

  for (const handler of HANDLER_ORDER[intent] || HANDLER_ORDER.unknown) {
    const result = await handler(message);
    if (result) return result;
  }

  return FALLBACK;
};

// ──────────────────────────────────────────────
// Tier 2 — Gemini, grounded with retrieved catalog context
// ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the HealthSphere assistant, a medical information helper.

Hard rules:
- NEVER diagnose. Never tell the user what they "have".
- NEVER prescribe, and never recommend a dose for the user personally.
- Always recommend consulting a qualified healthcare professional.
- Stay educational and general. Be warm but concise — under 200 words.
- Use only the CONTEXT below for specific facts about conditions and medicines.
  If the context does not cover it, say it is not in the catalog rather than
  inventing details.
- Never claim to be a doctor or a human.`;

/**
 * Retrieve catalog snippets relevant to the question so Gemini answers from our
 * data rather than its own recall. This is what makes Tier 2 trustworthy.
 */
const buildContext = async (message) => {
  const words = keywords(message);
  if (!words.length) return '';

  const rx = words.map(escapeRx).join('|');

  const [diseases, medicines] = await Promise.all([
    Disease.find({
      $or: [
        { name: { $regex: rx, $options: 'i' } },
        { symptoms: { $regex: rx, $options: 'i' } },
      ],
    })
      .select('name description symptoms severity specialistType slug')
      .limit(3),
    Medicine.find({
      isActive: { $ne: false },
      $or: [
        { name: { $regex: rx, $options: 'i' } },
        { genericName: { $regex: rx, $options: 'i' } },
        { uses: { $regex: rx, $options: 'i' } },
      ],
    })
      .select('name genericName summary uses prescriptionRequired slug')
      .limit(3),
  ]);

  const blocks = [];

  diseases.forEach((d) => {
    blocks.push(
      `CONDITION: ${d.name} (${d.severity}, seen by ${d.specialistType})\n` +
        `${d.description}\n` +
        `Symptoms: ${(d.symptoms || []).join(', ')}\n` +
        `Page: /diseases/${d.slug}`
    );
  });

  medicines.forEach((m) => {
    const rx2 = m.prescriptionRequired ? ' — prescription only' : ' — over the counter';
    blocks.push(
      `MEDICINE: ${m.name} (${m.genericName})${rx2}\n` +
        `${m.summary}\n` +
        `Used for: ${(m.uses || []).join(', ')}\n` +
        `Page: /medicines/${m.slug}`
    );
  });

  return blocks.length
    ? `\n\nCONTEXT FROM HEALTHSPHERE CATALOG:\n\n${blocks.join('\n\n')}`
    : '';
};

const geminiEngine = async (message, history) => {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const context = await buildContext(message);

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT + context,
  });

  // Gemini requires history to start with a 'user' turn and alternate. Our
  // sessions can open with an assistant greeting, so drop leading model turns.
  const mapped = history.map((m) => ({
    role: m.sender === 'ai' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
  while (mapped.length && mapped[0].role === 'model') mapped.shift();

  const chat = model.startChat({
    history: mapped.slice(-10),
    generationConfig: { maxOutputTokens: 800, temperature: 0.4 },
  });

  const result = await chat.sendMessage(message);
  const text = result.response.text()?.trim();

  if (!text) throw new Error('Gemini returned an empty response');
  return text;
};

// ──────────────────────────────────────────────
// Orchestration
// ──────────────────────────────────────────────

const isEmergency = (message) => {
  const lower = String(message).toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => lower.includes(k));
};

/**
 * @param   {Document} user         User document (mutated to record disclaimer ack)
 * @param   {string}   message      the incoming message
 * @param   {Array}    chatHistory  prior messages in this session
 * @returns {Promise<{reply: string, suggestions: string[], isEmergency: boolean}>}
 */
const processMessage = async (user, message, chatHistory = []) => {
  // 1. Safety gate — always wins, never reaches any model.
  if (isEmergency(message)) {
    return {
      reply: EMERGENCY_REPLY,
      suggestions: ['Find the nearest hospital', 'Show emergency contacts'],
      isEmergency: true,
    };
  }

  // 2. Tier 1 always runs: it supplies the suggestion chips and is the fallback
  //    if Tier 2 is unconfigured or fails.
  const grounded = await rulesEngine(message);
  let reply = grounded.reply;

  // 3. Tier 2 overlays a conversational answer when configured.
  if (AI_PROVIDER === 'gemini' && GEMINI_API_KEY) {
    try {
      reply = await geminiEngine(message, chatHistory);
    } catch (error) {
      // Quota exhausted, network down, safety block — fall back silently to the
      // grounded answer rather than failing the request.
      console.error('Gemini error, falling back to rules engine:', error.message);
    }
  }

  // 4. Disclaimer on the first ever reply for this user.
  if (!user.aiDisclaimerAccepted) {
    reply += DISCLAIMER;
    user.aiDisclaimerAccepted = true;
    await user.save({ validateBeforeSave: false });
  }

  return { reply, suggestions: grounded.suggestions, isEmergency: false };
};

module.exports = { processMessage, rulesEngine, isEmergency, detectIntent };
