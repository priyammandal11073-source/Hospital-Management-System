// Client-side drug interaction detection mirroring the server-side
// prescription safety service (same gold-standard pairs, compact list).

const normalize = (name = "") => String(name).toLowerCase().trim();

const INTERACTION_PAIRS = [
  { a: ["warfarin", "coumadin"], b: ["aspirin", "acetylsalicylic acid", "ibuprofen", "naproxen", "diclofenac", "indomethacin"], message: "Warfarin + NSAIDs/aspirin raises serious bleeding risk." },
  { a: ["simvastatin", "lovastatin"], b: ["clarithromycin", "erythromycin", "azithromycin", "itraconazole", "ketoconazole"], message: "Macrolide/azole + statin risks myopathy & rhabdomyolysis." },
  { a: ["clopidogrel"], b: ["omeprazole", "esomeprazole"], message: "PPI may reduce clopidogrel antiplatelet effect." },
  { a: ["digoxin"], b: ["amiodarone", "verapamil", "diltiazem", "spironolactone"], message: "Additive: risk of digoxin toxicity." },
  { a: ["lithium"], b: ["ibuprofen", "naproxen", "diclofenac", "enalapril", "lisinopril", "losartan", "valsartan"], message: "NSAIDs/ACE/ARB raise lithium — toxicity risk." },
  { a: ["methotrexate"], b: ["trimethoprim", "cotrimoxazole", "sulfamethoxazole"], message: "Additive folate antagonism — myelosuppression risk." },
  { a: ["sildenafil", "tadalafil", "vardenafil"], b: ["nitroglycerin", "isosorbide"], message: "PDE5 inhibitor + nitrate risks life-threatening hypotension." },
  { a: ["tramadol", "codeine", "fentanyl"], b: ["fluoxetine", "sertraline", "escitalopram", "paroxetine", "duloxetine", "amitriptyline"], message: "Opioid + serotonergic drug risks serotonin syndrome." },
  { a: ["spironolactone", "amiloride"], b: ["enalapril", "lisinopril", "losartan", "valsartan"], message: "Potassium-sparing diuretic + ACE/ARB risks hyperkalemia." },
  { a: ["glyburide", "glimepiride", "glipizide"], b: ["cotrimoxazole", "trimethoprim", "ciprofloxacin"], message: "Possible severe hypoglycaemia; monitor glucose." },
  { a: ["furosemide"], b: ["gentamicin", "amikacin", "vancomycin"], message: "Loop diuretic + aminoglycoside/vancomycin: ototoxicity/nephrotoxicity risk." },
];

export const findClientInteractions = (medications = []) => {
  const meds = Array.isArray(medications) ? medications : [];
  const results = [];
  for (const pair of INTERACTION_PAIRS) {
    const sideA = meds.filter((m) => pair.a.some((t) => normalize(m.name).includes(t)));
    const sideB = meds.filter((m) => pair.b.some((t) => normalize(m.name).includes(t)));
    if (sideA.length > 0 && sideB.length > 0) {
      results.push({
        medications: [sideA[0].name, sideB[0].name],
        message: pair.message,
      });
    }
  }
  return results;
};

export default findClientInteractions;