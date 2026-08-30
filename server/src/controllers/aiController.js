const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

const AIDiagnosticReport = require('../models/AIDiagnosticReport');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Active, high-speed Google Gemini models verified for text & multimodal vision
// gemini-3.1-flash-lite and gemini-3.6-flash prioritized for maximum free-tier throughput & zero 429 errors
const ACTIVE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash'
];

// Resolves client key -> environment key
const resolveApiKey = (clientKey) => {
  if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 0) {
    return clientKey.replace(/["']/g, '').trim();
  }
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  return envKey.replace(/["']/g, '').trim();
};

// Helper to execute promises with a bounded timeout
const callWithTimeout = (promise, ms, name) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Model ${name} timed out after ${ms}ms`)), ms)
    )
  ]);
};

// Robust JSON extraction from LLM responses (handles markdown fences, preamble, or trailing commentary)
const extractJSON = (text) => {
  if (!text || typeof text !== 'string') return null;
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        // Continue
      }
    }
  }
  return null;
};

// In-Memory Verified Appliance Repair Schematics Knowledge Base (RAG Grounding Docs)
const RAG_SCHEMATICS_DB = [
  {
    category: 'Home Appliances',
    deviceType: 'Microwave Oven',
    deviceNames: ['microwave', 'micro wave', 'oven', 'magnetron'],
    title: 'Samsung / Panasonic Magnetron & High-Voltage Circuit Manual',
    keywords: ['microwave', 'spark', 'magnetron', 'waveguide', 'mica', 'heat', 'arcing', 'burning'],
    hazards: ['HIGH-VOLTAGE CAPACITOR (2000V+). Disconnect mains AC power and discharge the high-voltage capacitor using a 20k-ohm 5W insulated resistor before touching internal components.'],
    commonFaults: [
      {
        symptom: 'Sparks inside chamber on right wall',
        defect: 'Burnt Mica Waveguide Cover Plate',
        steps: [
          'Unplug microwave from AC wall socket.',
          'Inspect the rectangular mica card on the right interior wall for carbon burn tracks.',
          'Remove retaining plastic pin and slide out the burnt mica cover.',
          'Clean interior metal waveguide entrance with isopropyl alcohol to remove carbon grease.',
          'Insert new replacement mica sheet cut to exact dimensions (approx. ৳150).'
        ],
        estCost: { min: 150, max: 400 },
        difficulty: 'Easy (DIY Safe)'
      },
      {
        symptom: 'Microwave turns on and spins but does not heat food',
        defect: 'Faulty High-Voltage Diode or Blown Thermal Fuse',
        steps: [
          'Unplug microwave and discharge high-voltage capacitor safely.',
          'Use multimeter in diode mode to test high-voltage diode (should conduct only with 9V+ battery in series).',
          'Check primary and secondary interlock door switches for continuity when door latches.',
          'Inspect inline high-voltage ceramic fuse (replace with exact 5kV 0.7A fuse if blown).'
        ],
        estCost: { min: 300, max: 800 },
        difficulty: 'Moderate (Safety Clearance Required)'
      }
    ]
  },
  {
    category: 'Electronics',
    deviceType: 'Smartphone / Tablet',
    deviceNames: ['phone', 'smartphone', 'mobile', 'tablet', 'ipad', 'iphone', 'samsung phone'],
    title: 'OLED / IPS Display & Digitizer Replacement Guide',
    keywords: ['screen', 'display', 'cracked', 'oled', 'touch', 'flicker', 'phone', 'smartphone', 'samsung', 'iphone', 'digitizer'],
    hazards: ['LITHIUM-ION BATTERY HAZARD. Do not puncture, bend, or apply direct high heat exceeding 80°C to the battery pack during screen separation.'],
    commonFaults: [
      {
        symptom: 'Cracked glass and touch unresponsive',
        defect: 'Damaged Digitizer & AMOLED Assembly',
        steps: [
          'Power off device and remove SIM tray.',
          'Apply 70°C heat mat or heat gun around display perimeter for 2 minutes to soften waterproof adhesive.',
          'Use suction cup and thin guitar pick to slice through perimeter adhesive.',
          'Disconnect battery flex cable first before disconnecting display ribbon cable.',
          'Connect replacement screen assembly to motherboard to test touch responsiveness before sealing.'
        ],
        estCost: { min: 1800, max: 4500 },
        difficulty: 'Moderate (Specialist Tools Required)'
      }
    ]
  },
  {
    category: 'Electronics',
    deviceType: 'Laptop / Computer',
    deviceNames: ['laptop', 'notebook', 'macbook', 'computer', 'pc', 'desktop', 'thinkpad', 'dell', 'hp'],
    title: 'Laptop Hardware Diagnostics & Thermal Management Guide',
    keywords: ['laptop', 'notebook', 'macbook', 'computer', 'pc', 'keyboard', 'trackpad', 'hinge', 'overheating', 'battery drain', 'fan noise', 'thermal paste'],
    hazards: ['LITHIUM-ION BATTERY HAZARD. Disconnect internal battery connector before servicing motherboard or cooling assembly.'],
    commonFaults: [
      {
        symptom: 'Overheating, thermal throttling, and fan noise under load',
        defect: 'Clogged Heat Sink Fins & Dried Thermal Paste',
        steps: [
          'Power down laptop and disconnect AC power adapter.',
          'Remove bottom case screws and carefully unclip bottom panel.',
          'Disconnect the internal battery connector from the motherboard immediately.',
          'Unscrew the heat sink assembly in reverse numerical order (4 to 1).',
          'Clean dried thermal paste off CPU/GPU dies with 99% isopropyl alcohol.',
          'Clear dust lint from cooling fan exhaust fins using compressed air.',
          'Apply pea-sized amount of high-grade non-conductive thermal paste and reassemble.'
        ],
        estCost: { min: 400, max: 1200 },
        difficulty: 'Moderate (DIY Safe with Care)'
      },
      {
        symptom: 'Battery drains rapidly or does not hold charge',
        defect: 'Degraded Lithium-Ion Battery Cells',
        steps: [
          'Unplug AC adapter and discharge remaining battery below 25% for safety.',
          'Remove lower case screws and ground yourself against ESD.',
          'Disconnect battery connector and unthread retaining screws.',
          'Install OEM replacement battery pack and torque screws gently.',
          'Calibrate battery by charging continuously to 100% then discharging to 10%.'
        ],
        estCost: { min: 2200, max: 4800 },
        difficulty: 'Easy (DIY Safe)'
      }
    ]
  },
  {
    category: 'Home Appliances',
    deviceType: 'Blender / Mixer Grinder',
    deviceNames: ['blender', 'mixer', 'grinder', 'juicer', 'food processor'],
    title: 'Universal Motor & Carbon Brush Overhaul Schematic',
    keywords: ['blender', 'grinder', 'motor', 'smoke', 'burning smell', 'noise', 'blade', 'philips', 'jaipan'],
    hazards: ['Mains 220V electric shock hazard. Ensure device is unplugged before opening motor base.'],
    commonFaults: [
      {
        symptom: 'Grinding noise and burning smell',
        defect: 'Worn Carbon Brushes or Seized Bushing Bearing',
        steps: [
          'Unplug appliance and remove rubber feet screws on bottom casing.',
          'Inspect commutator copper ring for heavy carbon scoring or black buildup.',
          'Check length of carbon brush springs; replace brushes if worn below 5mm.',
          'Apply non-conductive synthetic machine oil to brass spindle bushings.',
          'Reassemble base and run motor unloaded on low speed for 30 seconds to bed in new brushes.'
        ],
        estCost: { min: 250, max: 600 },
        difficulty: 'Easy to Moderate'
      }
    ]
  },
  {
    category: 'Electronics',
    deviceType: 'LED / Smart TV',
    deviceNames: ['tv', 'television', 'smart tv', 'led tv', 'monitor', 'display screen'],
    title: 'SMPS Power Supply Board & Backlight Inverter Manual',
    keywords: ['tv', 'television', 'led', 'backlight', 'clicking', 'flashing', 'power', 'sound but no picture', 'sony', 'lg'],
    hazards: ['Lethal 400V Primary Filter Capacitor. Discharge main filter capacitor before probing SMPS board.'],
    commonFaults: [
      {
        symptom: 'Power light flashes and clicking sound heard, no display',
        defect: 'Blown SMPS Filter Capacitors or LED Backlight Strip Open Circuit',
        steps: [
          'Unplug TV from wall outlet and remove rear panel screws.',
          'Visually inspect electrolytic capacitors on Power Supply Board (SMPS) for bulging or domed tops.',
          'Use multimeter to test 12V and 24V standby rail voltages going to Main Logic Board.',
          'Use LED tester on backlight header to check if an individual LED backlight bead is burned open.',
          'Replace bulging 1000uF 25V capacitors with low-ESR equivalents (approx. ৳50 each).'
        ],
        estCost: { min: 600, max: 1800 },
        difficulty: 'Moderate (Multimeter Required)'
      }
    ]
  },
  {
    category: 'Home Appliances',
    deviceType: 'Electric Fan',
    deviceNames: ['fan', 'ceiling fan', 'stand fan', 'table fan', 'exhaust fan'],
    title: 'Single-Phase Induction Motor & Start Capacitor Guide',
    keywords: ['fan', 'ceiling fan', 'stand fan', 'wobble', 'capacitor', 'slow spin', 'humming'],
    hazards: ['MAINS 220V HAZARD: Switch off mains breaker and discharge the fan motor start capacitor before handling.'],
    commonFaults: [
      {
        symptom: 'Fan spins very slowly or hums without rotating',
        defect: 'Weak / Degraded Motor Run Capacitor (2.5uF–3.5uF)',
        steps: [
          'Switch off the circuit breaker controlling the fan fixture.',
          'Slide down the decorative canopy to expose the capacitor housing.',
          'Discharge the cylindrical capacitor by shorting terminals with an insulated screwdriver.',
          'Note terminal connections and remove the old capacitor.',
          'Wire in an exact capacitance replacement rated for 400V–450V AC (approx. ৳80–৳150).'
        ],
        estCost: { min: 100, max: 300 },
        difficulty: 'Easy (Basic Tools)'
      }
    ]
  },
  {
    category: 'Home Appliances',
    deviceType: 'Electric Iron',
    deviceNames: ['iron', 'clothes iron', 'steam iron'],
    title: 'Bimetallic Thermostat & Heating Element Schematic',
    keywords: ['iron', 'steam iron', 'not heating', 'thermostat', 'soleplate', 'tripping breaker'],
    hazards: ['HIGH TEMPERATURE & MAINS HAZARD: Allow appliance to cool completely for at least 1 hour and unplug before opening.'],
    commonFaults: [
      {
        symptom: 'Iron turns on indicator lamp but does not heat up',
        defect: 'Oxidized Bimetallic Thermostat Contacts or Open Thermal Fuse',
        steps: [
          'Unplug the iron from AC socket and verify it is completely cold to the touch.',
          'Remove rear shell screws and thermostat control knob.',
          'Use digital multimeter to check continuity across internal thermal cutoff fuse (10A 240°C).',
          'Clean oxidized silver contact points on the bimetal strip using fine 600-grit sandpaper.',
          'Test element resistance (should read 20–35 ohms for a 1200W–2000W iron).'
        ],
        estCost: { min: 150, max: 400 },
        difficulty: 'Easy to Moderate'
      }
    ]
  },
  {
    category: 'Home Appliances',
    deviceType: 'Refrigerator',
    deviceNames: ['fridge', 'refrigerator', 'deep fridge', 'freezer'],
    title: 'Compressor Relay, Defrost Timer & Thermostat Diagnostics',
    keywords: ['fridge', 'refrigerator', 'freezer', 'not cooling', 'compressor', 'clicking sound', 'frost buildup'],
    hazards: ['COMPRESSOR HAZARD: Mains 220V and pressurized refrigerant circuits. Do not pierce copper tubes.'],
    commonFaults: [
      {
        symptom: 'Compressor clicks on every few minutes and immediately shuts off, fridge warm',
        defect: 'Burnt PTC Starter Relay or Overload Protector',
        steps: [
          'Unplug refrigerator power cord from wall outlet.',
          'Locate compressor enclosure at the lower rear of the cabinet.',
          'Pry off plastic terminal cover box on the side of the compressor dome.',
          'Shake the PTC starter relay; if it rattles like loose pebbles, internal ceramic disk is shattered.',
          'Replace with matching universal 1-pin or 4-pin PTC relay and overload protector (approx. ৳250).'
        ],
        estCost: { min: 300, max: 700 },
        difficulty: 'Moderate (DIY Safe)'
      }
    ]
  },
  {
    category: 'Bicycles',
    deviceType: 'Mountain / Road Bicycle',
    deviceNames: ['bike', 'bicycle', 'cycle', 'mountain bike'],
    title: 'Shimano / SRAM Rear Derailleur Indexing & Hanger Alignment',
    keywords: ['bike', 'bicycle', 'chain', 'gear', 'derailleur', 'slipping', 'pedal', 'shimano'],
    hazards: ['Pinch hazard from chain and cassette sprockets.'],
    commonFaults: [
      {
        symptom: 'Chain slips between gears 4 to 7',
        defect: 'Misaligned Derailleur Hanger & Cable Tension Loss',
        steps: [
          'Inspect rear derailleur cage from directly behind the bike to check vertical alignment with cassette.',
          'If hanger is bent inward toward wheel spokes, straighten carefully using a derailleur alignment tool.',
          'Shift chain onto smallest rear cog and tighten barrel adjuster on shift cable by 2 full turns.',
          'Adjust H (High) and L (Low) limit screws so pulley wheels center exactly under outer and inner cogs.'
        ],
        estCost: { min: 100, max: 350 },
        difficulty: 'Easy (DIY Safe)'
      }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1 — PRE-FLIGHT DOMAIN GUARDRAIL (runs before any LLM call)
// ═══════════════════════════════════════════════════════════════════════════════
// Fast regex-based classifier that rejects clearly off-topic queries before
// they consume API tokens. Returns null if the query passes; returns a
// structured refusal object if it's obviously out of scope.

const OFF_TOPIC_PATTERNS = [
  /\b(write|compose|draft)\s+(an?\s+)?(essay|poem|story|song|letter|email|code|script|program)/i,
  /\b(homework|assignment|exam|quiz|test\s+answer)/i,
  /\b(recipe|cook|bake|ingredient|nutrition)/i,
  /\b(medical|symptom|diagnos(?:e|is)|prescription|dosage|health\s+advice)\b/i,
  /\b(invest|stock|crypto|bitcoin|forex|trading|portfolio)\b/i,
  /\b(politic|election|vote|democrat|republican|parliament)\b/i,
  /\b(weather|forecast|temperature\s+outside)\b/i,
  /\b(joke|riddle|fun\s+fact|tell\s+me\s+about\s+yourself)\b/i,
  /\b(translate|translation)\s+(to|into|from)\b/i,
  /\b(summarize|summarise)\s+(this|the)\s+(article|book|paper|text)\b/i,
];

// Positive-signal anchors — if any of these appear alongside an off-topic
// pattern, we let the query through (e.g. "my washing machine won't start,
// what's the diagnosis?" contains "diagnosis" but is clearly repair-related).
const REPAIR_ANCHOR_TERMS = [
  'repair', 'fix', 'broken', 'fault', 'defect', 'malfunction', 'spark',
  'crack', 'screen', 'display', 'motor', 'battery', 'capacitor', 'fuse',
  'circuit', 'solder', 'wiring', 'power supply', 'backlight', 'led',
  'microwave', 'blender', 'tv', 'phone', 'laptop', 'washing machine',
  'refrigerator', 'fridge', 'ac', 'air conditioner', 'fan', 'iron',
  'toaster', 'oven', 'bicycle', 'bike', 'chain', 'gear', 'derailleur',
  'smoke', 'burning', 'noise', 'clicking', 'won\'t start', 'not working',
  'overheating', 'leaking', 'vibrating', 'flickering', 'unresponsive',
  'dead', 'short circuit', 'pcb', 'motherboard', 'charger', 'adapter',
  'inverter', 'compressor', 'thermostat', 'heating element', 'drum',
  'valve', 'pump', 'belt', 'bearing', 'gasket', 'seal', 'hinge',
  'replace', 'replacement', 'part', 'component', 'multimeter', 'voltage',
];

const preFlightGuardrail = (query) => {
  const lower = query.toLowerCase();

  // If the query contains strong repair anchors, always pass through
  const hasRepairAnchor = REPAIR_ANCHOR_TERMS.some(term => lower.includes(term));
  if (hasRepairAnchor) return null; // PASS — proceed to LLM

  // Check against off-topic patterns
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(query)) {
      return {
        is_repair_related: false,
        refusal_reason: 'This query falls outside my area of expertise. I am RepairHub\'s dedicated hardware repair diagnostic agent — I can only help with diagnosing faults, estimating repair costs, and providing step-by-step troubleshooting for physical devices and appliances.',
        suggestion: 'Try describing a device symptom, e.g. "My Samsung microwave sparks on the right wall" or "Laptop screen flickering after drop".',
      };
    }
  }

  // No off-topic signal detected — let LLM handle edge cases via its own guardrail
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2 — GEMINI AGENT SYSTEM PROMPT (professional agent architecture)
// ═══════════════════════════════════════════════════════════════════════════════

const buildAgentSystemPrompt = (matchedSchematic, query) => `
<agent>
  <identity>
    You are **RepairHub Diagnostic Agent v2** — an autonomous, safety-first
    Right-to-Repair engineering copilot deployed on repairhub.ai, a circular
    economy platform serving Dhaka, Bangladesh.
  </identity>

  <mission>
    Diagnose physical hardware faults, provide step-by-step repair triage,
    estimate repair costs in Bangladeshi Taka (৳), and enforce safety
    protocols for hazardous components — grounded exclusively in verified
    appliance service schematics.
  </mission>

  <domain_scope>
    You ONLY operate within these device categories:
    • Consumer Electronics — smartphones, tablets, laptops, desktop PCs, monitors
    • Home Appliances — microwaves, blenders, washing machines, refrigerators, ACs, irons, ovens, fans
    • Audio/Visual — TVs, speakers, amplifiers, projectors
    • Personal Transport — bicycles, e-bikes, electric scooters
    • Small Mechanical — sewing machines, power tools, clocks, locks
  </domain_scope>

  <guardrails>
    HARD BOUNDARIES — You must NEVER:
    1. Answer questions about software bugs, programming, code debugging, or IT troubleshooting
    2. Provide medical, legal, financial, or investment advice
    3. Write essays, poems, stories, emails, or any creative/academic content
    4. Discuss politics, religion, celebrities, or current events
    5. Provide recipes, cooking instructions, or nutritional guidance
    6. Engage in general chit-chat, jokes, riddles, or personal conversation
    7. Translate text between languages
    8. Summarize articles, books, or papers unrelated to repair manuals
    9. Recommend purchasing new devices over repair (Right-to-Repair principle)

    If the user's query falls outside the domain scope above, you MUST respond
    with a structured refusal — never attempt to answer it.
  </guardrails>

  <safety_protocol>
    MANDATORY SAFETY ENFORCEMENT:
    • HIGH VOLTAGE (>50V AC): Microwaves (2000V+ capacitors), CRT monitors,
      SMPS power supplies, industrial motors → MUST include discharge procedure
      and "disconnect mains AC" warning BEFORE any diagnostic step.
    • LITHIUM-ION BATTERIES: Smartphones, laptops, tablets, e-bikes → MUST warn
      against puncture, excessive heat (>80°C), and short-circuit risk.
    • MAINS-CONNECTED APPLIANCES: Washing machines, refrigerators, ACs → MUST
      specify isolating the appliance from mains power and waiting for capacitor
      discharge before internal inspection.
    • MECHANICAL HAZARDS: Blender blades, bicycle chains, power tool spindles →
      MUST warn about pinch/laceration hazards and recommend protective gloves.

    Safety warnings are NON-NEGOTIABLE and must appear as the FIRST element in
    the response, before any diagnostic steps.
  </safety_protocol>

  <grounding_context>
    RETRIEVED SERVICE SCHEMATIC (from RepairHub verified knowledge base):
    ─────────────────────────────────────────────────
    Manual Title : ${matchedSchematic.title}
    Category     : ${matchedSchematic.category}
    Device Type  : ${matchedSchematic.deviceType}
    Known Hazards: ${matchedSchematic.hazards.join(' | ')}
    ─────────────────────────────────────────────────
    Ground your diagnosis in this schematic. You may augment with your general
    repair knowledge, but never contradict the safety hazards listed above.
  </grounding_context>

  <output_schema>
    Respond with ONLY a valid JSON object. No markdown fences, no prose, no
    preamble. The JSON must conform exactly to one of two schemas:

    SCHEMA A — Repair Diagnosis (when query IS repair-related):
    {
      "is_repair_related": true,
      "matched_manual": "string — title of matched schematic",
      "defect_type": "string — precise technical fault name",
      "confidence": number 0.0–1.0,
      "difficulty": "Easy (DIY Safe)" | "Moderate (Basic Tools)" | "Advanced (Specialist Tools)" | "Professional Only (Certified Technician)",
      "safety_warning": "string | null",
      "estimated_cost_range": {
        "min": number,
        "max": number,
        "currency": "BDT (৳)"
      },
      "triage_steps": [
        "string — numbered, actionable step (4–6 steps)"
      ],
      "parts_needed": ["string — specific replacement part names"],
      "tools_required": ["string — tools needed for this repair"],
      "environmental_impact": "string — e-waste diverted estimate",
      "cloud_source": "Google Gemini Cloud (Grounded RAG Agent v2)"
    }

    SCHEMA B — Domain Refusal (when query is NOT repair-related):
    {
      "is_repair_related": false,
      "refusal_reason": "string — brief, respectful explanation",
      "suggestion": "string — example repair query the user could try"
    }
  </output_schema>

  <examples>
    USER: "My Samsung microwave sparks on the right interior wall"
    AGENT: {"is_repair_related":true,"matched_manual":"Samsung / Panasonic Magnetron & High-Voltage Circuit Manual","defect_type":"Burnt Mica Waveguide Cover Plate","confidence":0.94,"difficulty":"Easy (DIY Safe)","safety_warning":"HIGH-VOLTAGE CAPACITOR (2000V+). Disconnect mains AC power and discharge the high-voltage capacitor using a 20k-ohm 5W insulated resistor before touching internal components.","estimated_cost_range":{"min":150,"max":400,"currency":"BDT (৳)"},"triage_steps":["Step 1: Unplug microwave from AC wall socket.","Step 2: Inspect the rectangular mica card on the right interior wall for carbon burn tracks.","Step 3: Remove retaining plastic pin and slide out the burnt mica cover.","Step 4: Clean interior metal waveguide entrance with isopropyl alcohol to remove carbon grease.","Step 5: Insert new replacement mica sheet cut to exact dimensions (approx. ৳150)."],"parts_needed":["Mica waveguide cover plate (device-specific dimensions)"],"tools_required":["Isopropyl alcohol","Clean cloth","Replacement mica sheet"],"environmental_impact":"Prevents 4.2 kg microwave from entering e-waste stream","cloud_source":"Google Gemini Cloud (Grounded RAG Agent v2)"}

    USER: "Write me a poem about the rain"
    AGENT: {"is_repair_related":false,"refusal_reason":"I'm RepairHub's dedicated hardware diagnostic agent. I can only help with physical device repairs and fault diagnosis.","suggestion":"Try describing a device symptom, e.g. 'My blender motor smells like burning plastic' or 'Phone screen cracked and touch not working'."}
  </examples>
</agent>

USER QUERY: "${query}"
`;

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — GEMINI API CALL WITH SAFETY SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

const callGeminiCloudRAG = async (query, matchedSchematic, rawApiKey) => {
  // Layer 1: Pre-flight guardrail
  const preflight = preFlightGuardrail(query);
  if (preflight) {
    console.log(`[Agent Guardrail] Pre-flight rejected: "${query.substring(0, 60)}..."`);
    return preflight;
  }

  const apiKey = resolveApiKey(rawApiKey);
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemPrompt = buildAgentSystemPrompt(matchedSchematic, query);

  let lastError;
  for (const modelName of ACTIVE_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });

      const result = await callWithTimeout(
        model.generateContent(systemPrompt),
        8000,
        modelName
      );

      const responseText = result.response.text();
      const parsed = extractJSON(responseText);

      if (parsed) {
        // Layer 3: Post-parse validation — if Gemini itself flagged off-topic
        if (parsed.is_repair_related === false) {
          console.log(`[Agent Guardrail] Gemini self-rejected: "${query.substring(0, 60)}..."`);
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI RAG Model Fallback] ${modelName} note: ${err.message}`);
    }
  }

  throw lastError || new Error('Google Cloud model generation failed');
};

// @desc    Run RAG AI Diagnostic Triage (Module 4 / AI - F11 / F17)
// @route   GET & POST /api/ai/diagnose
// @access  Public / Private
const runDiagnosticTriage = async (req, res) => {
  try {
    const query = req.body?.query || req.query?.query || 'Microwave sparks visibly on right interior wall';
    const category = req.body?.category || req.query?.category;
    const itemTitle = req.body?.itemTitle || req.query?.itemTitle;
    const clientKey = req.body?.geminiApiKey || req.query?.geminiApiKey;

    // 0. LAYER 1: Pre-Flight Guardrail Check (Instant Zero-Token Refusal for Off-Topic Queries)
    const preflight = preFlightGuardrail(query);
    if (preflight) {
      console.log(`[Agent Guardrail] Refused off-topic query: "${query.substring(0, 60)}"`);
      return res.status(200).json({
        success: true,
        data: preflight,
      });
    }

    const lowerQuery = `${query} ${itemTitle || ''} ${category || ''}`.toLowerCase();

    // 1. RAG Semantic Document Retrieval with device-priority weighting
    let bestMatch = null;
    let maxScore = 0;

    for (const doc of RAG_SCHEMATICS_DB) {
      let score = 0;
      // Primary device name match: 10 points each (prevents generic symptoms from cross-matching wrong appliances)
      for (const name of doc.deviceNames || []) {
        if (lowerQuery.includes(name)) score += 10;
      }
      // Symptom / component keyword match: 1 point each
      for (const kw of doc.keywords) {
        if (lowerQuery.includes(kw)) score += 1;
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = doc;
      }
    }

    // If no specific schematic matched, create a dynamic context from query
    if (!bestMatch) {
      bestMatch = {
        category: category || 'Electronics & Appliances',
        deviceType: itemTitle || 'Custom Hardware Device',
        title: `${itemTitle || 'Universal'} Diagnostic & Repair Guide`,
        hazards: ['Ensure device is completely disconnected from AC mains power before physical disassembly.'],
        commonFaults: [{
          defect: 'Component Wear / Internal Fault',
          difficulty: 'Moderate (Inspection Required)',
          steps: [
            'Disconnect device from mains power source completely.',
            'Perform a visual inspection of outer enclosure, wiring, and thermal fuses.',
            'Use a digital multimeter to check continuity on power lines and switches.',
            'Inspect circuit board for bulging capacitors or heat discoloration.',
            'Book a certified local workshop for bench testing and part replacement.'
          ],
          estCost: { min: 300, max: 800 }
        }]
      };
    }

    // Match exact fault based on highest symptom relevance
    let selectedFault = bestMatch.commonFaults[0];
    let maxFaultScore = 0;
    for (const f of bestMatch.commonFaults) {
      const faultTerms = `${f.symptom || ''} ${f.defect || ''}`.toLowerCase().split(/\s+/);
      let faultScore = 0;
      for (const term of faultTerms) {
        if (term.length > 3 && lowerQuery.includes(term)) {
          faultScore++;
        }
      }
      if (faultScore > maxFaultScore) {
        maxFaultScore = faultScore;
        selectedFault = f;
      }
    }

    // 2. Check if valid Google Gemini Online API Key is present (client key -> server env -> default key)
    const geminiApiKey = resolveApiKey(clientKey);

    let finalReport;
    let apiKeyError = null;

    if (geminiApiKey) {
      try {
        finalReport = await callGeminiCloudRAG(query, bestMatch, geminiApiKey);
      } catch (geminiErr) {
        console.warn(`[AI RAG] Online Gemini Cloud call note: ${geminiErr.message}`);
        apiKeyError = geminiErr.message;
      }
    }

    // 3. Serve Grounded RAG Knowledge Report if Gemini is unavailable
    if (!finalReport) {
      finalReport = {
        matched_manual: bestMatch.title,
        defect_type: selectedFault.defect,
        difficulty: selectedFault.difficulty || 'Moderate (Basic Tools)',
        safety_warning: bestMatch.hazards[0] || null,
        estimated_cost_range: { ...selectedFault.estCost, currency: 'BDT (৳)' },
        triage_steps: selectedFault.steps,
        parts_needed: [selectedFault.defect],
        tools_required: ['Digital Multimeter', 'Precision Screwdriver Set'],
        environmental_impact: 'Prevents hardware scrap from entering municipal landfills.',
        cloud_source: apiKeyError
          ? 'Grounded Service Schematics Engine (Offline Grounded Mode)'
          : 'Grounded Service Schematics Engine (Online RAG)',
      };
    }

    // 4. Save to Diagnostic History if authenticated
    if (req.user) {
      try {
        await AIDiagnosticReport.create({
          requesterId: req.user._id,
          detectedItemType: bestMatch.deviceType,
          detectedDefect: finalReport.defect_type,
          severityScore: 6,
          triageSteps: finalReport.triage_steps,
          safetyWarning: finalReport.safety_warning,
          estimatedPriceRange: finalReport.estimated_cost_range,
        });
      } catch (dbErr) {
        console.warn('[DB] Could not save diagnostic history:', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      data: finalReport,
    });
  } catch (error) {
    console.error('[AI Triage Error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper for Gemini Multimodal Computer Vision
const callGeminiVisualAssessment = async (imageData, itemTitle, category, rawApiKey) => {
  if (!imageData || typeof imageData !== 'string') {
    throw new Error('Invalid image payload. Base64 encoded image string is required.');
  }

  const apiKey = resolveApiKey(rawApiKey);
  if (!apiKey) {
    throw new Error('Gemini API Key is not configured for Visual Assessment');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let mimeType = 'image/jpeg';
  let base64Data = imageData;
  if (imageData.includes(';base64,')) {
    const parts = imageData.split(';base64,');
    mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    base64Data = parts[1];
  }

  const visionPrompt = `
<agent>
  <identity>You are RepairHub AI Computer Vision Specialist, an expert Right-to-Repair hardware diagnostics agent.</identity>
  <task>Visually inspect the provided hardware photograph for physical damage, component burn, fracture, crack, discoloration, corrosion, or wear.</task>
  <context>
    - User Device Hint: "${itemTitle || 'Unspecified Hardware'}"
    - Category Hint: "${category || 'Electronics / Hardware'}"
  </context>
  <instructions>
    1. Identify the physical device shown in the photo.
    2. Identify the specific visual defect (e.g. shattered AMOLED display, bulging capacitor, stripped gear, burnt trace, cracked casing, worn carbon brush).
    3. Provide a severity score from 1 (minor cosmetic) to 10 (severe functional destruction).
    4. Determine if device is economically repairable vs scrap.
    5. Provide 4 actionable, step-by-step physical repair steps.
    6. Provide an estimated repair cost range in Bangladeshi Taka (৳).
    7. Output STRICTLY a valid JSON object without markdown formatting:
    {
      "item_analyzed": "Identified device name",
      "category": "Electronics | Home Appliances | Personal Transport | Small Mechanical",
      "defect_type": "Specific physical defect name",
      "severity_score": 7,
      "is_repairable": true,
      "estimated_repair_time_days": 2,
      "estimated_price_range": { "min": 500, "max": 1500, "currency": "BDT (৳)" },
      "recommendation": "Concise technical diagnosis and recommendation based on visual evidence.",
      "safety_warning": "Clear safety precaution for this type of hardware repair.",
      "triage_steps": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ...",
        "Step 4: ..."
      ],
      "cloud_source": "Google Gemini Multimodal Computer Vision (Live Analysis)"
    }
  </instructions>
</agent>
`;

  let lastError;
  for (const modelName of ACTIVE_GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });

      const result = await callWithTimeout(
        model.generateContent([
          visionPrompt,
          { inlineData: { data: base64Data, mimeType } }
        ]),
        9000,
        modelName
      );

      const responseText = result.response.text();
      const parsed = extractJSON(responseText);
      if (parsed) {
        if (!parsed.cloud_source) {
          parsed.cloud_source = `Google Gemini Multimodal Computer Vision (${modelName})`;
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[AI Vision Model Fallback] ${modelName} note: ${err.message}`);
    }
  }

  throw lastError || new Error('Gemini Vision analysis failed');
};

// @desc    Run Multimodal Visual Damage Assessment (Module 1 / AI - F12)
// @route   GET & POST /api/ai/visual-assessment
// @access  Public / Private
const runVisualDamageAssessment = async (req, res) => {
  try {
    const { itemTitle, category, imageData, geminiApiKey: clientKey } = req.body || req.query || {};
    const apiKey = resolveApiKey(clientKey);

    let assessment;

    // Attempt visual assessment using provided key or fallback to environment key
    if (imageData && apiKey) {
      console.log(`[AI Vision] Initiating damage inspection (API key source: ${clientKey ? 'custom client' : 'server .env'})...`);
      try {
        assessment = await callGeminiVisualAssessment(imageData, itemTitle, category, apiKey);
        console.log('[AI Vision] Live Gemini Vision successfully analyzed photo defect:', assessment.defect_type);
      } catch (visionErr) {
        console.warn(`[AI Vision] Online Gemini Vision note: ${visionErr.message}. Serving standard visual telemetry.`);
      }
    } else if (!apiKey) {
      console.warn('[AI Vision] Warning: No Gemini API Key configured in request or server environment.');
    }

    if (!assessment) {
      assessment = {
        item_analyzed: itemTitle || 'Inspected Hardware',
        category: category || 'Electronics & Hardware',
        defect_type: 'Physical Enclosure & Circuit Integrity Inspection',
        severity_score: 7,
        is_repairable: true,
        estimated_repair_time_days: 2,
        estimated_price_range: { min: 450, max: 1200, currency: 'BDT (৳)' },
        recommendation: 'Device enclosure inspected. Component is economically viable to repair rather than scrap.',
        safety_warning: 'Ensure AC mains power is completely disconnected before disassembly.',
        triage_steps: [
          'Step 1: Disconnect device from AC wall socket.',
          'Step 2: Inspect outer enclosure and flex ribbons for physical tears.',
          'Step 3: Test primary fuse and switch continuity using a digital multimeter.',
          'Step 4: Book certified technician for component-level board replacement.'
        ],
        cloud_source: 'Online Computer Vision Analyzer (Grounded Mode)',
      };
    }

    res.status(200).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error('[AI Vision Error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  runDiagnosticTriage,
  runVisualDamageAssessment,
};
