// ── Prescription Safety Service ───────────────────────────────────────
// Server-side allergy + drug-interaction checks that run when a doctor
// concludes a consultation with a prescription (belt-and-braces over the
// client-side acknowledgement flow in the Consultation Workspace).

const normalize = (name = "") => String(name).toLowerCase().trim();

// Known clinically significant drug interactions (alias-based matching).
// severity: "major" (avoid/use with extreme caution), "moderate" (monitor/caution).
const INTERACTION_RULES = [
  {
    a: ["warfarin", "coumadin"],
    b: ["aspirin", "acetylsalicylic acid", "ibuprofen", "naproxen", "diclofenac", "piroxicam", "meloxicam", "indomethacin"],
    severity: "major",
    message: "Warfarin with NSAIDs / aspirin increases the risk of serious gastrointestinal bleeding.",
  },
  {
    a: ["warfarin", "coumadin"],
    b: ["simvastatin", "atorvastatin", "lovastatin", "rosuvastatin", "pravastatin"],
    severity: "moderate",
    message: "Possible additive anticoagulant effect with warfarin and co-prescribed statins; monitor INR.",
  },
  {
    a: ["simvastatin", "lovastatin"],
    b: ["clarithromycin", "erythromycin", "azithromycin", "itraconazole", "ketoconazole", "fluconazole", "amiloride"],
    severity: "major",
    message: "CYP3A4 macrolide / azole with high-dose statin increases risk of myopathy and rhabdomyolysis.",
  },
  {
    a: ["clopidogrel"],
    b: ["omeprazole", "esomeprazole"],
    severity: "moderate",
    message: "PPI may reduce clopidogrel activation, lowering antiplatelet effect; consider pantoprazole.",
  },
  {
    a: ["digoxin"],
    b: ["amiodarone", "verapamil", "diltiazem", "spironolactone", "furosemide", "alprazolam"],
    severity: "major",
    message: "Co-administration increases digoxin levels with risk of toxicity; monitor serum digoxin.",
  },
  {
    a: ["metformin"],
    b: ["cimetidine", "dolutegravir", "iodinated"],
    severity: "moderate",
    message: "May increase metformin exposure; monitor renal function and watch for lactic acidosis symptoms.",
  },
  {
    a: ["lithium"],
    b: ["ibuprofen", "naproxen", "diclofenac", "indomethacin", "celecoxib", "enalapril", "lisinopril", "ramipril", "perindopril", "losartan", "valsartan", "telmisartan"],
    severity: "major",
    message: "NSAIDs / ACE inhibitors / ARBs raise lithium levels — risk of lithium toxicity.",
  },
  {
    a: ["methotrexate"],
    b: ["trimethoprim", "cotrimoxazole", "sulfamethoxazole", "aspirin", "ibuprofen"],
    severity: "major",
    message: "Additive folate antagonism increases myelosuppression risk with methotrexate.",
  },
  {
    a: ["sildenafil", "tadalafil", "vardenafil"],
    b: ["isosorbide", "nitroglycerin", "nitroglycerine", "glyceryl trinitrate", "isosorbide mononitrate", "isosorbide dinitrate"],
    severity: "major",
    message: "PDE5 inhibitor with any nitrate can cause life-threatening hypotension.",
  },
  {
    a: ["tramadol", "codeine", "fentanyl"],
    b: ["fluoxetine", "sertraline", "escitalopram", "paroxetine", "citalopram", "venlafaxine", "duloxetine", "amitriptyline", "linezolid"],
    severity: "major",
    message: "Opioid + serotonergic agent raises the risk of serotonin syndrome (agitation, rigidity, fever).",
  },
  {
    a: ["verapamil", "diltiazem", "amiodarone", "metoprolol", "propranolol", "atenolol", "bisoprolol"],
    b: ["verapamil", "diltiazem", "amiodarone", "metoprolol", "propranolol", "atenolol", "bisoprolol", "ivabradine"],
    severity: "moderate",
    message: "Combined rate/AV-node blocking agents may cause bradycardia or AV block; monitor ECG and heart rate.",
  },
  {
    a: ["spironolactone", "eplerenone", "amiloride", "triamterene"],
    b: ["enalapril", "lisinopril", "ramipril", "perindopril", "losartan", "valsartan", "telmisartan", "candesartan"],
    severity: "major",
    message: "Potassium-sparing diuretic with ACE inhibitor / ARB risks severe hyperkalemia.",
  },
  {
    a: ["ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin"],
    b: ["tizanidine", "digoxin", "theophylline"],
    severity: "major",
    message: "Fluoroquinolone may cause dangerous concentration effects with the co-prescribed agent; verify dosing.",
  },
  {
    a: ["amiodarone"],
    b: ["simvastatin", "lovastatin", "pitavastatin"],
    severity: "major",
    message: "Amiodarone markedly increases statin exposure — myopathy/rhabdomyolysis risk.",
  },
  {
    a: ["glyburide", "glimepiride", "glipizide", "gliclazide", "chlorpropamide"],
    b: ["trimethoprim", "sulfamethoxazole", "cotrimoxazole", "fluconazole", "ciprofloxacin", "warfarin"],
    severity: "major",
    message: "Sulfonylurea interactions can precipitate severe hypoglycaemia; add glucose monitoring.",
  },
  {
    a: ["atazanavir", "lopinavir", "ritonavir", "saquinavir"],
    b: ["simvastatin", "lovastatin", "amlodipine", "sildenafil", "midazolam"],
    severity: "major",
    message: "CYP3A4 protease inhibitors sharply raise drug levels — high toxicity potential.",
  },
  {
    a: ["furosemide", "bumetanide"],
    b: ["gentamicin", "amikacin", "tobramycin", "vancomycin"],
    severity: "major",
    message: "Loop diuretic with aminoglycoside / vancomycin increases ototoxicity & nephrotoxicity risk.",
  },
];

const hasAnyToken = (medName, tokens) => {
  const name = normalize(medName);
  if (!name) return false;
  return tokens.some((token) => name.includes(token));
};

// Returns allergy alerts: a medication matching a documented patient allergy.
export const detectAllergyAlerts = (patientAllergies = [], medications = []) => {
  const allergies = Array.isArray(patientAllergies)
    ? patientAllergies
    : patientAllergies
    ? [patientAllergies]
    : [];

  const alerts = [];
  for (const med of medications) {
    const name = normalize(med.name);
    if (!name) continue;
    for (const allergy of allergies) {
      const a = normalize(allergy);
      if (!a) continue;
      if (name.includes(a) || a.includes(name)) {
        alerts.push({
          type: "allergy",
          severity: "critical",
          medication: med.name,
          matchedAllergy: allergy,
          message: `${med.name} matches the patient's documented allergy to ${allergy}.`,
        });
      }
    }
  }
  return alerts;
};

// Returns drug-drug interaction alerts across the given medication list.
export const detectInteractionAlerts = (medications = []) => {
  const meds = Array.isArray(medications) ? medications : [];
  const interactions = [];

  for (const rule of INTERACTION_RULES) {
    const sideA = meds.filter((m) => hasAnyToken(m.name, rule.a));
    const sideB = meds.filter((m) => hasAnyToken(m.name, rule.b));
    if (sideA.length > 0 && sideB.length > 0) {
      interactions.push({
        type: "interaction",
        severity: rule.severity,
        medications: [sideA[0].name, sideB[0].name],
        message: rule.message,
      });
    }
  }
  return interactions;
};

// Full check: blocking (allergy) alerts + warning (interaction) alerts.
export const checkPrescriptionSafety = ({ patientAllergies, medications }) => {
  const allergyAlerts = detectAllergyAlerts(patientAllergies, medications);
  const interactionAlerts = detectInteractionAlerts(medications);

  const alerts = [...allergyAlerts, ...interactionAlerts];
  return {
    alerts,
    blocking: allergyAlerts, // allergies always require explicit acknowledgement
    hasBlocking: allergyAlerts.length > 0,
    summary: alerts.map((alert) => `${alert.message}`).join(" "),
  };
};

export default { checkPrescriptionSafety, detectAllergyAlerts, detectInteractionAlerts };