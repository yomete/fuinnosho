import { formatDimensions, getExposuresPerRoll } from "../films/schema.js";
import { createFilmToolHandlers } from "./film-tools.js";
import { createTripToolHandlers } from "./trip-tools.js";
import { createGearToolHandlers } from "./gear-tools.js";
export { formatDimensions, getExposuresPerRoll };
export const TOOL_DEFINITIONS = [
    {
        name: "get_film_inventory",
        description: "Get complete film inventory with current stock levels",
        inputSchema: {
            type: "object",
            properties: {
                include_availability: {
                    type: "boolean",
                    description: "Include availability data for trip planning",
                    default: false,
                },
            },
        },
    },
    {
        name: "filter_films",
        description: "Filter films by type, ISO range, format, or other criteria",
        inputSchema: {
            type: "object",
            properties: {
                type: { type: "string", description: "Film type (color, bw, cinema)" },
                iso_min: { type: "number", description: "Minimum ISO value" },
                iso_max: { type: "number", description: "Maximum ISO value" },
                format: { type: "string", description: "Film format (35mm, 120, 4x5)" },
                brand: { type: "string", description: "Film brand" },
                in_stock_only: {
                    type: "boolean",
                    description: "Only show films with count > 0",
                    default: false,
                },
            },
        },
    },
    {
        name: "update_film_quantity",
        description: "Update film quantity when using rolls (reduces count and logs usage)",
        inputSchema: {
            type: "object",
            properties: {
                film_id: { type: "string", description: "Film ID to update" },
                quantity: {
                    type: "number",
                    description: "Number of rolls used (positive number)",
                },
                usage_note: { type: "string", description: "Note about film usage" },
            },
        },
    },
    {
        name: "spool_bulk_film",
        description: "Spool bulk film into cassettes (for bulk films only)",
        inputSchema: {
            type: "object",
            properties: {
                film_id: { type: "string", description: "Bulk film ID to spool from" },
                exposures_to_spool: {
                    type: "number",
                    description: "Number of exposures from bulk film to use for spooling",
                },
                cassettes_created: {
                    type: "number",
                    description: "Number of cassettes created from the bulk film",
                },
                spool_note: {
                    type: "string",
                    description: "Note about the spooling process",
                },
            },
            required: [
                "film_id",
                "exposures_to_spool",
                "cassettes_created",
                "spool_note",
            ],
        },
    },
    {
        name: "check_low_stock",
        description: "Check for films with low stock (configurable threshold)",
        inputSchema: {
            type: "object",
            properties: {
                threshold: {
                    type: "number",
                    description: "Stock level considered low",
                    default: 3,
                },
                include_out_of_stock: {
                    type: "boolean",
                    description: "Include films with 0 count",
                    default: true,
                },
            },
        },
    },
    {
        name: "get_film_usage_history",
        description: "Get usage history for a specific film",
        inputSchema: {
            type: "object",
            properties: {
                film_id: {
                    type: "string",
                    description: "Film ID to get usage history for",
                },
            },
            required: ["film_id"],
        },
    },
    {
        name: "get_film_stats",
        description: "Get aggregate statistics about film inventory",
        inputSchema: {
            type: "object",
            properties: {
                group_by: {
                    type: "string",
                    enum: ["type", "brand", "format", "iso"],
                    description: "How to group the statistics",
                    default: "type",
                },
            },
        },
    },
    {
        name: "create_film",
        description: "Add a new film to the inventory",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Film name" },
                brand: { type: "string", description: "Film brand" },
                iso: { type: "number", description: "ISO speed" },
                format: {
                    type: "string",
                    description: "Film format (35mm, 120, 4x5, etc.)",
                },
                type: {
                    type: "string",
                    description: "Film type (Color Negative, Black & White, etc.)",
                },
                expiration_date: {
                    type: "string",
                    description: "Expiration date (YYYY-MM-DD format)",
                },
                count: { type: "number", description: "Number of rolls", default: 1 },
                price: { type: "number", description: "Price per roll" },
                notes: { type: "string", description: "Additional notes", default: "" },
                editing_notes: {
                    type: "string",
                    description: "Editing tips and notes for this film stock",
                    default: "",
                },
                is_ecn: {
                    type: "boolean",
                    description: "Whether this is an ECN (Eastman Color Negative) motion picture film",
                    default: false,
                },
                is_bulk_film: {
                    type: "boolean",
                    description: "Whether this is bulk film",
                    default: false,
                },
                bulk_length_meters: {
                    type: "number",
                    description: "Length in meters for bulk film",
                },
            },
            required: ["name", "brand", "iso", "format", "type", "expiration_date"],
        },
    },
    {
        name: "edit_film",
        description: "Edit an existing film's details",
        inputSchema: {
            type: "object",
            properties: {
                film_id: { type: "string", description: "Film ID to edit" },
                name: { type: "string", description: "Film name" },
                brand: { type: "string", description: "Film brand" },
                iso: { type: "number", description: "ISO speed" },
                format: {
                    type: "string",
                    description: "Film format (35mm, 120, 4x5, etc.)",
                },
                type: {
                    type: "string",
                    description: "Film type (Color Negative, Black & White, etc.)",
                },
                expiration_date: {
                    type: "string",
                    description: "Expiration date (YYYY-MM-DD format)",
                },
                count: { type: "number", description: "Number of rolls" },
                price: { type: "number", description: "Price per roll" },
                notes: { type: "string", description: "Additional notes" },
                editing_notes: {
                    type: "string",
                    description: "Editing tips and notes for this film stock",
                },
                is_ecn: {
                    type: "boolean",
                    description: "Whether this is an ECN (Eastman Color Negative) motion picture film",
                },
                is_bulk_film: {
                    type: "boolean",
                    description: "Whether this is bulk film",
                },
                bulk_length_meters: {
                    type: "number",
                    description: "Length in meters for bulk film",
                },
            },
            required: ["film_id"],
        },
    },
    {
        name: "delete_film",
        description: "Delete a film from the inventory",
        inputSchema: {
            type: "object",
            properties: {
                film_id: { type: "string", description: "Film ID to delete" },
            },
            required: ["film_id"],
        },
    },
    {
        name: "create_trip",
        description: "Create a new photo trip with duration support",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Trip title" },
                description: {
                    type: "string",
                    description: "Trip description",
                    default: "",
                },
                start_date: {
                    type: "string",
                    description: "Trip start date (YYYY-MM-DD format)",
                },
                end_date: {
                    type: "string",
                    description: "Trip end date (YYYY-MM-DD format)",
                },
            },
            required: ["title", "start_date", "end_date"],
        },
    },
    {
        name: "list_trips",
        description: "List all trips with optional filtering",
        inputSchema: {
            type: "object",
            properties: {
                include_past: {
                    type: "boolean",
                    description: "Include past trips",
                    default: true,
                },
                include_films: {
                    type: "boolean",
                    description: "Include reserved films for each trip",
                    default: false,
                },
            },
        },
    },
    {
        name: "get_trip_details",
        description: "Get detailed information about a specific trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
            },
            required: ["trip_id"],
        },
    },
    {
        name: "edit_trip",
        description: "Edit an existing trip's details with duration support",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID to edit" },
                title: { type: "string", description: "Trip title" },
                description: { type: "string", description: "Trip description" },
                start_date: {
                    type: "string",
                    description: "Trip start date (YYYY-MM-DD format)",
                },
                end_date: {
                    type: "string",
                    description: "Trip end date (YYYY-MM-DD format)",
                },
                status: {
                    type: "string",
                    description: "Trip status (upcoming, ongoing, past, completed)",
                    enum: ["upcoming", "ongoing", "past", "completed"],
                },
            },
            required: ["trip_id"],
        },
    },
    {
        name: "delete_trip",
        description: "Delete a trip and all its film reservations",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID to delete" },
            },
            required: ["trip_id"],
        },
    },
    {
        name: "reserve_film_for_trip",
        description: "Reserve films for a specific trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
                film_id: { type: "string", description: "Film ID to reserve" },
                quantity: {
                    type: "number",
                    description: "Number of rolls to reserve",
                },
            },
            required: ["trip_id", "film_id", "quantity"],
        },
    },
    {
        name: "remove_film_reservation",
        description: "Remove film reservation from a trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
                film_id: { type: "string", description: "Film ID to unreserve" },
            },
            required: ["trip_id", "film_id"],
        },
    },
    {
        name: "update_film_reservation_quantity",
        description: "Update the quantity of a film reservation for a trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
                film_id: { type: "string", description: "Film ID" },
                quantity: {
                    type: "number",
                    description: "New quantity of rolls to reserve (must be >= 1)",
                },
            },
            required: ["trip_id", "film_id", "quantity"],
        },
    },
    {
        name: "get_films_with_availability",
        description: "Get films with availability data for trip planning",
        inputSchema: {
            type: "object",
            properties: {
                available_only: {
                    type: "boolean",
                    description: "Only show films with available stock",
                    default: false,
                },
                min_available: {
                    type: "number",
                    description: "Minimum available quantity required",
                    default: 1,
                },
            },
        },
    },
    {
        name: "create_gear",
        description: "Add new gear/equipment to inventory",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Gear name/title" },
                brand: { type: "string", description: "Gear brand/manufacturer" },
                type: {
                    type: "string",
                    description: "Gear type (camera, lens, flash, accessory, tripod, filter, bag)",
                    enum: [
                        "camera",
                        "lens",
                        "flash",
                        "accessory",
                        "tripod",
                        "filter",
                        "bag",
                    ],
                },
                model: { type: "string", description: "Model number or name" },
                serial_number: { type: "string", description: "Serial number" },
                purchase_date: {
                    type: "string",
                    description: "Purchase date (YYYY-MM-DD format)",
                },
                purchase_price: { type: "number", description: "Purchase price" },
                condition: {
                    type: "string",
                    description: "Current condition",
                    enum: ["excellent", "good", "fair", "poor"],
                    default: "good",
                },
                notes: {
                    type: "string",
                    description: "Additional notes",
                    default: "",
                },
            },
            required: ["name", "brand", "type", "condition"],
        },
    },
    {
        name: "list_gear",
        description: "Get all gear/equipment with optional filtering",
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    description: "Filter by gear type",
                    enum: [
                        "camera",
                        "lens",
                        "flash",
                        "accessory",
                        "tripod",
                        "filter",
                        "bag",
                    ],
                },
                brand: { type: "string", description: "Filter by brand" },
                condition: {
                    type: "string",
                    description: "Filter by condition",
                    enum: ["excellent", "good", "fair", "poor"],
                },
                include_trip_reservations: {
                    type: "boolean",
                    description: "Include gear reserved for upcoming trips",
                    default: false,
                },
            },
        },
    },
    {
        name: "edit_gear",
        description: "Edit existing gear details",
        inputSchema: {
            type: "object",
            properties: {
                gear_id: { type: "string", description: "Gear ID to edit" },
                name: { type: "string", description: "Gear name/title" },
                brand: { type: "string", description: "Gear brand/manufacturer" },
                type: {
                    type: "string",
                    description: "Gear type",
                    enum: [
                        "camera",
                        "lens",
                        "flash",
                        "accessory",
                        "tripod",
                        "filter",
                        "bag",
                    ],
                },
                model: { type: "string", description: "Model number or name" },
                serial_number: { type: "string", description: "Serial number" },
                purchase_date: {
                    type: "string",
                    description: "Purchase date (YYYY-MM-DD format)",
                },
                purchase_price: { type: "number", description: "Purchase price" },
                condition: {
                    type: "string",
                    description: "Current condition",
                    enum: ["excellent", "good", "fair", "poor"],
                },
                notes: { type: "string", description: "Additional notes" },
            },
            required: ["gear_id"],
        },
    },
    {
        name: "delete_gear",
        description: "Delete gear from inventory",
        inputSchema: {
            type: "object",
            properties: {
                gear_id: { type: "string", description: "Gear ID to delete" },
            },
            required: ["gear_id"],
        },
    },
    {
        name: "get_gear_stats",
        description: "Get gear statistics and summary",
        inputSchema: {
            type: "object",
            properties: {
                group_by: {
                    type: "string",
                    enum: ["type", "brand", "condition"],
                    description: "How to group the statistics",
                    default: "type",
                },
            },
        },
    },
    {
        name: "reserve_gear_for_trip",
        description: "Reserve gear for a specific trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
                gear_id: { type: "string", description: "Gear ID to reserve" },
            },
            required: ["trip_id", "gear_id"],
        },
    },
    {
        name: "remove_gear_reservation",
        description: "Remove gear reservation from a trip",
        inputSchema: {
            type: "object",
            properties: {
                trip_id: { type: "string", description: "Trip ID" },
                gear_id: { type: "string", description: "Gear ID to unreserve" },
            },
            required: ["trip_id", "gear_id"],
        },
    },
];
export function createToolHandlers(supabase, userId) {
    const filmHandlers = createFilmToolHandlers(supabase, userId);
    const tripHandlers = createTripToolHandlers(supabase, userId);
    const gearHandlers = createGearToolHandlers(supabase, userId);
    return {
        get_film_inventory: filmHandlers.getFilmInventory,
        filter_films: filmHandlers.filterFilms,
        update_film_quantity: filmHandlers.updateFilmQuantity,
        spool_bulk_film: filmHandlers.spoolBulkFilm,
        check_low_stock: filmHandlers.checkLowStock,
        get_film_usage_history: filmHandlers.getFilmUsageHistory,
        get_film_stats: filmHandlers.getFilmStats,
        create_film: filmHandlers.createFilm,
        edit_film: filmHandlers.editFilm,
        delete_film: filmHandlers.deleteFilm,
        create_trip: tripHandlers.createTrip,
        list_trips: tripHandlers.listTrips,
        get_trip_details: tripHandlers.getTripDetails,
        edit_trip: tripHandlers.editTrip,
        delete_trip: tripHandlers.deleteTrip,
        reserve_film_for_trip: tripHandlers.reserveFilmForTrip,
        remove_film_reservation: tripHandlers.removeFilmReservation,
        update_film_reservation_quantity: tripHandlers.updateFilmReservationQuantity,
        get_films_with_availability: tripHandlers.getFilmsWithAvailability,
        create_gear: gearHandlers.createGear,
        list_gear: gearHandlers.listGear,
        edit_gear: gearHandlers.editGear,
        delete_gear: gearHandlers.deleteGear,
        get_gear_stats: gearHandlers.getGearStats,
        reserve_gear_for_trip: gearHandlers.reserveGearForTrip,
        remove_gear_reservation: gearHandlers.removeGearReservation,
    };
}
