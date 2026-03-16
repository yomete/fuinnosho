/**
 * Seed data for demo mode
 * Curated realistic film photography inventory data
 */

import { DEMO_USER_ID } from "./demo";

// Deterministic UUIDs for reliable reset
const filmIds = {
  portra400_35mm: "00000000-0000-4000-a000-000000000001",
  portra800_35mm: "00000000-0000-4000-a000-000000000002",
  hp5_35mm: "00000000-0000-4000-a000-000000000003",
  ektar100_120: "00000000-0000-4000-a000-000000000004",
  trix400_bulk: "00000000-0000-4000-a000-000000000005",
  gold200_35mm: "00000000-0000-4000-a000-000000000006",
  provia100f_35mm: "00000000-0000-4000-a000-000000000007",
  cinestill800t_35mm: "00000000-0000-4000-a000-000000000008",
};

const gearIds = {
  leicaM6: "00000000-0000-4000-b000-000000000001",
  canonAE1: "00000000-0000-4000-b000-000000000002",
  hasselblad500cm: "00000000-0000-4000-b000-000000000003",
  summicron50: "00000000-0000-4000-b000-000000000004",
  canon50f14: "00000000-0000-4000-b000-000000000005",
  zeiss80f28: "00000000-0000-4000-b000-000000000006",
  sekonic: "00000000-0000-4000-b000-000000000007",
  peakDesignBag: "00000000-0000-4000-b000-000000000008",
};

const tripIds = {
  tokyoStreet: "00000000-0000-4000-c000-000000000001",
  yosemiteLandscape: "00000000-0000-4000-c000-000000000002",
  brooklynPortraits: "00000000-0000-4000-c000-000000000003",
};

// Helper to generate dates relative to current date
function getRelativeDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

export const seedFilms = [
  {
    id: filmIds.portra400_35mm,
    name: "Portra 400",
    brand: "Kodak",
    iso: 400,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2026-06-01",
    price: 14.99,
    count: 8,
    notes: "Great for portraits and weddings. Beautiful skin tones.",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.portra800_35mm,
    name: "Portra 800",
    brand: "Kodak",
    iso: 800,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2026-03-15",
    price: 16.99,
    count: 4,
    notes: "Low light specialist. Works great for indoor events.",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.hp5_35mm,
    name: "HP5 Plus 400",
    brand: "Ilford",
    iso: 400,
    format: "35mm",
    type: "Black & White",
    expiration_date: "2027-01-01",
    price: 9.99,
    count: 12,
    notes: "Classic B&W. Pushes well to 1600 or 3200.",
    editing_notes: "Develop in Rodinal 1+50 for 13min at 20C",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.ektar100_120,
    name: "Ektar 100",
    brand: "Kodak",
    iso: 100,
    format: "120",
    type: "Color Negative",
    expiration_date: "2026-09-01",
    price: 12.99,
    count: 6,
    notes: "Extremely fine grain. Perfect for landscapes.",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.trix400_bulk,
    name: "Tri-X 400 (Bulk)",
    brand: "Kodak",
    iso: 400,
    format: "35mm",
    type: "Black & White",
    expiration_date: "2027-06-01",
    price: 89.99,
    count: 5,
    notes: "100ft bulk roll. The legendary film.",
    is_bulk_film: true,
    bulk_length_meters: 30.5,
    bulk_quantity: 1,
    calculated_rolls: 18,
    bulk_remaining_exposures: 540,
    spooled_cassettes: 5,
    bulk_rolls_used: 0,
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.gold200_35mm,
    name: "Gold 200",
    brand: "Kodak",
    iso: 200,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2025-12-01",
    price: 8.99,
    count: 3,
    notes: "Budget friendly. Warm tones, great for sunny days.",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.provia100f_35mm,
    name: "Provia 100F",
    brand: "Fujifilm",
    iso: 100,
    format: "35mm",
    type: "Slide",
    expiration_date: "2026-04-01",
    price: 18.99,
    count: 2,
    notes: "Slide film with vivid colors. Great for projection.",
    user_id: DEMO_USER_ID,
  },
  {
    id: filmIds.cinestill800t_35mm,
    name: "CineStill 800T",
    brand: "CineStill",
    iso: 800,
    format: "35mm",
    type: "Color Negative",
    expiration_date: "2026-08-01",
    price: 15.99,
    count: 4,
    notes: "Tungsten balanced. Amazing halation effect around lights.",
    is_ecn: true,
    user_id: DEMO_USER_ID,
  },
];

export const seedGear = [
  {
    id: gearIds.leicaM6,
    name: "M6 Classic",
    brand: "Leica",
    type: "camera" as const,
    model: "M6 0.72",
    serial_number: "1234567",
    purchase_date: "2022-06-15",
    purchase_price: 2800,
    condition: "excellent" as const,
    notes: "Daily driver. The perfect street camera.",
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.canonAE1,
    name: "AE-1 Program",
    brand: "Canon",
    type: "camera" as const,
    model: "AE-1 Program",
    serial_number: "7891234",
    purchase_date: "2021-03-20",
    purchase_price: 180,
    condition: "good" as const,
    notes: "Great beginner camera. Reliable metering.",
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.hasselblad500cm,
    name: "500C/M",
    brand: "Hasselblad",
    type: "camera" as const,
    model: "500C/M",
    serial_number: "UB12345",
    purchase_date: "2023-01-10",
    purchase_price: 1500,
    condition: "excellent" as const,
    notes: "Medium format beast. With waist level finder.",
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.summicron50,
    name: "Summicron 50mm f/2",
    brand: "Leica",
    type: "lens" as const,
    model: "v4 (Made in Canada)",
    serial_number: "3456789",
    purchase_date: "2022-06-15",
    purchase_price: 1200,
    condition: "excellent" as const,
    notes: "Bought with M6. Sharp and compact.",
    camera_id: gearIds.leicaM6,
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.canon50f14,
    name: "FD 50mm f/1.4",
    brand: "Canon",
    type: "lens" as const,
    model: "FD 50mm f/1.4 S.S.C.",
    purchase_price: 120,
    condition: "good" as const,
    notes: "Classic nifty fifty. Great bokeh.",
    camera_id: gearIds.canonAE1,
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.zeiss80f28,
    name: "Planar 80mm f/2.8",
    brand: "Zeiss",
    type: "lens" as const,
    model: "C 80mm f/2.8",
    purchase_price: 450,
    condition: "excellent" as const,
    notes: "Standard lens for Hasselblad. Incredibly sharp.",
    camera_id: gearIds.hasselblad500cm,
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.sekonic,
    name: "L-308X",
    brand: "Sekonic",
    type: "accessory" as const,
    model: "Flashmate",
    purchase_date: "2022-08-01",
    purchase_price: 200,
    condition: "excellent" as const,
    notes: "Compact light meter. Essential for slide film.",
    user_id: DEMO_USER_ID,
  },
  {
    id: gearIds.peakDesignBag,
    name: "Everyday Sling 6L",
    brand: "Peak Design",
    type: "bag" as const,
    model: "V2",
    purchase_date: "2023-05-15",
    purchase_price: 110,
    condition: "excellent" as const,
    notes: "Perfect size for one body and two lenses.",
    user_id: DEMO_USER_ID,
  },
];

export const seedTrips = [
  {
    id: tripIds.tokyoStreet,
    title: "Tokyo Street Photography",
    description:
      "Exploring Shibuya, Shinjuku, and Harajuku neighborhoods. Focus on neon lights and street fashion.",
    start_date: getRelativeDate(14),
    end_date: getRelativeDate(21),
    status: "upcoming" as const,
    user_id: DEMO_USER_ID,
  },
  {
    id: tripIds.yosemiteLandscape,
    title: "Yosemite Landscape Trip",
    description:
      "Capturing Half Dome, El Capitan, and waterfalls. Early morning and golden hour shoots.",
    start_date: getRelativeDate(45),
    end_date: getRelativeDate(49),
    status: "upcoming" as const,
    user_id: DEMO_USER_ID,
  },
  {
    id: tripIds.brooklynPortraits,
    title: "Brooklyn Portrait Series",
    description:
      "Environmental portraits in DUMBO and Williamsburg. Collaboration with local artists.",
    start_date: getRelativeDate(-7),
    end_date: getRelativeDate(-5),
    status: "past" as const,
    user_id: DEMO_USER_ID,
  },
];

export const seedTripFilms = [
  {
    trip_id: tripIds.tokyoStreet,
    film_id: filmIds.cinestill800t_35mm,
    quantity: 4,
  },
  {
    trip_id: tripIds.tokyoStreet,
    film_id: filmIds.portra800_35mm,
    quantity: 2,
  },
  { trip_id: tripIds.tokyoStreet, film_id: filmIds.hp5_35mm, quantity: 3 },
  {
    trip_id: tripIds.yosemiteLandscape,
    film_id: filmIds.ektar100_120,
    quantity: 4,
  },
  {
    trip_id: tripIds.yosemiteLandscape,
    film_id: filmIds.provia100f_35mm,
    quantity: 2,
  },
  {
    trip_id: tripIds.brooklynPortraits,
    film_id: filmIds.portra400_35mm,
    quantity: 5,
  },
];

export const seedTripGear = [
  { trip_id: tripIds.tokyoStreet, gear_id: gearIds.leicaM6 },
  { trip_id: tripIds.tokyoStreet, gear_id: gearIds.summicron50 },
  { trip_id: tripIds.tokyoStreet, gear_id: gearIds.sekonic },
  { trip_id: tripIds.yosemiteLandscape, gear_id: gearIds.hasselblad500cm },
  { trip_id: tripIds.yosemiteLandscape, gear_id: gearIds.zeiss80f28 },
  { trip_id: tripIds.brooklynPortraits, gear_id: gearIds.canonAE1 },
  { trip_id: tripIds.brooklynPortraits, gear_id: gearIds.canon50f14 },
];

// Export IDs for use in reset operations
export const seedIds = {
  films: Object.values(filmIds),
  gear: Object.values(gearIds),
  trips: Object.values(tripIds),
};
