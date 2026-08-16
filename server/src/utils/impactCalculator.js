/**
 * Environmental Impact Benchmark Matrix
 * Waste diverted (in kg) and CO2 emissions prevented (in kg) per category
 */
const IMPACT_COEFFICIENTS = {
  Electronics: {
    wasteDivertedKg: 0.35,
    co2SavedKg: 45.0, // Significant embodied carbon in silicon and PCB
  },
  'Home Appliances': {
    wasteDivertedKg: 8.5,
    co2SavedKg: 35.0,
  },
  Furniture: {
    wasteDivertedKg: 15.0,
    co2SavedKg: 28.0,
  },
  'Textiles & Clothing': {
    wasteDivertedKg: 0.8,
    co2SavedKg: 12.5,
  },
  Bicycles: {
    wasteDivertedKg: 14.0,
    co2SavedKg: 65.0,
  },
  Mechanical: {
    wasteDivertedKg: 6.0,
    co2SavedKg: 20.0,
  },
  Other: {
    wasteDivertedKg: 1.5,
    co2SavedKg: 8.0,
  },
};

/**
 * Calculates environmental savings based on category
 */
const calculateEnvironmentalImpact = (category) => {
  const coeff = IMPACT_COEFFICIENTS[category] || IMPACT_COEFFICIENTS['Other'];
  return {
    wasteDivertedKg: Number(coeff.wasteDivertedKg.toFixed(2)),
    co2SavedKg: Number(coeff.co2SavedKg.toFixed(2)),
  };
};

module.exports = { calculateEnvironmentalImpact, IMPACT_COEFFICIENTS };
