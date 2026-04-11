import * as z from "zod";
export const formatDimensions = {
    "35mm": {
        width: 35,
        height: 24,
        unit: "mm",
        rollLength: 36,
        bulkLengthPerRoll: 1.65,
    },
    "120": {
        width: 60,
        height: 60,
        unit: "mm",
        rollLength: 12,
        bulkLengthPerRoll: 0.8,
    },
    "4x5": {
        width: 102,
        height: 127,
        unit: "mm",
        sheetsPerBox: 10,
        bulkLengthPerRoll: 0,
    },
};
export const filmSchema = z.object({
    name: z.string().min(1),
    brand: z.string().min(1),
    iso: z.number().min(1),
    format: z.string().min(1),
    type: z.string().min(1),
    expiration_date: z.string().min(1),
    price: z.number().nullable().optional(),
    count: z.number().nullable().optional(),
    notes: z.string().optional(),
    editing_notes: z.string().optional(),
    is_ecn: z.boolean().optional(),
    is_bulk_film: z.boolean().optional(),
    bulk_length_meters: z.number().positive().optional(),
    bulk_quantity: z.number().positive().optional(),
    bulk_rolls_used: z.number().nonnegative().optional(),
    calculated_rolls: z.number().optional(),
    bulk_remaining_exposures: z.number().nonnegative().optional(),
    spooled_cassettes: z.number().nonnegative().optional(),
});
export function getExposuresPerRoll(format) {
    const formatInfo = formatDimensions[format];
    if (!formatInfo)
        return 36;
    if ("rollLength" in formatInfo)
        return formatInfo.rollLength;
    if ("sheetsPerBox" in formatInfo)
        return formatInfo.sheetsPerBox;
    return 36;
}
export function calculateRollsFromBulkFilm(bulkLengthMeters, format, bulkQuantity = 1) {
    const formatInfo = formatDimensions[format];
    if (!formatInfo || formatInfo.bulkLengthPerRoll === 0) {
        return 0;
    }
    const wasteFactor = 0.9;
    const rollsPerBulk = (bulkLengthMeters * wasteFactor) / formatInfo.bulkLengthPerRoll;
    return Math.floor(rollsPerBulk) * bulkQuantity;
}
export function getBulkFilmInfo(format) {
    const formatInfo = formatDimensions[format];
    return formatInfo
        ? {
            supportsBulk: formatInfo.bulkLengthPerRoll > 0,
            lengthPerRoll: formatInfo.bulkLengthPerRoll,
            format,
        }
        : null;
}
