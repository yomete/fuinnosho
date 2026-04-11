import { createGearForUser, deleteGearForUser, getGearForUser, getGearStatsForUser, getGearSummaryForUser, removeGearReservationForUser, reserveGearForTripForUser, } from "../gear/service.js";
import { getTripByIdForUser } from "../trips/service.js";
function jsonResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
}
export function createGearToolHandlers(supabase, userId) {
    async function createGear(args) {
        const { name, brand, type, model, serial_number, purchase_date, purchase_price, condition = "good", notes = "", } = args;
        if (!name || !brand || !type || !condition) {
            throw new Error("Missing required fields: name, brand, type, condition");
        }
        const gear = userId
            ? await createGearForUser(supabase, userId, {
                name,
                brand,
                type: type,
                model,
                serial_number,
                purchase_date,
                purchase_price,
                condition: condition,
                notes,
            })
            : (await supabase
                .from("gear")
                .insert({
                name,
                brand,
                type,
                model,
                serial_number,
                purchase_date,
                purchase_price,
                condition,
                notes,
            })
                .select()
                .single()).data;
        return jsonResult({
            success: true,
            message: "Gear created successfully",
            gear,
        });
    }
    async function listGear(args) {
        const { type, brand, condition, include_trip_reservations = false } = args;
        const gear = userId
            ? await getGearForUser(supabase, userId, { type, brand, condition })
            : (await supabase
                .from("gear")
                .select("*")
                .order("type", { ascending: true })
                .order("brand", { ascending: true })
                .order("name", { ascending: true })).data || [];
        if (include_trip_reservations && gear) {
            for (const item of gear) {
                const { data: reservations } = await supabase
                    .from("trip_gear")
                    .select(`
            trips (id, title, start_date, end_date)
          `)
                    .eq("gear_id", item.id);
                item.trip_reservations =
                    reservations || [];
            }
        }
        const totalValue = gear?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0;
        const gearByType = gear?.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {}) || {};
        return jsonResult({
            summary: {
                total_gear: gear?.length || 0,
                total_value: totalValue,
                gear_by_type: gearByType,
                filters_applied: { type, brand, condition, include_trip_reservations },
            },
            gear: gear || [],
        });
    }
    async function editGear(args) {
        const { gear_id, ...updateData } = args;
        if (!gear_id) {
            throw new Error("gear_id is required");
        }
        const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([, value]) => value !== undefined));
        if (Object.keys(cleanedData).length === 0) {
            throw new Error("No fields to update");
        }
        let updateQuery = supabase
            .from("gear")
            .update(cleanedData)
            .eq("id", gear_id);
        if (userId)
            updateQuery = updateQuery.eq("user_id", userId);
        const { data: gear, error } = await updateQuery.select().single();
        if (error) {
            throw new Error(`Failed to update gear: ${error.message}`);
        }
        if (!gear) {
            throw new Error("Gear not found");
        }
        return jsonResult({
            success: true,
            message: "Gear updated successfully",
            gear,
        });
    }
    async function deleteGear(args) {
        const { gear_id } = args;
        if (!gear_id) {
            throw new Error("gear_id is required");
        }
        const gear = userId
            ? await getGearSummaryForUser(supabase, userId, gear_id)
            : (await supabase
                .from("gear")
                .select("name, brand, type")
                .eq("id", gear_id)
                .single()).data;
        if (!gear) {
            throw new Error("Gear not found");
        }
        if (userId) {
            await deleteGearForUser(supabase, userId, gear_id);
        }
        else {
            const { error: deleteError } = await supabase
                .from("gear")
                .delete()
                .eq("id", gear_id);
            if (deleteError) {
                throw new Error(`Failed to delete gear: ${deleteError.message}`);
            }
        }
        return jsonResult({
            success: true,
            message: `Gear "${gear.brand} ${gear.name}" (${gear.type}) deleted successfully`,
            deleted_gear: {
                id: gear_id,
                name: gear.name,
                brand: gear.brand,
                type: gear.type,
            },
        });
    }
    async function getGearStats(args) {
        const { group_by = "type" } = args;
        const { gear, stats } = userId
            ? await getGearStatsForUser(supabase, userId, group_by)
            : { gear: [], stats: {} };
        const totalValue = gear?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0;
        const totalGear = gear?.length || 0;
        return jsonResult({
            grouped_by: group_by,
            total_categories: Object.keys(stats).length,
            overall_summary: {
                total_gear: totalGear,
                total_value: totalValue,
                average_value: totalGear > 0 ? totalValue / totalGear : 0,
            },
            statistics: stats,
        });
    }
    async function reserveGearForTrip(args) {
        const { trip_id, gear_id } = args;
        if (!trip_id || !gear_id) {
            throw new Error("trip_id and gear_id are required");
        }
        const trip = userId
            ? await getTripByIdForUser(supabase, userId, trip_id)
            : (await supabase.from("trips").select("title").eq("id", trip_id).single()).data;
        const gear = userId
            ? await getGearSummaryForUser(supabase, userId, gear_id)
            : (await supabase
                .from("gear")
                .select("name, brand, type")
                .eq("id", gear_id)
                .single()).data;
        if (!trip) {
            throw new Error("Trip not found");
        }
        if (!gear) {
            throw new Error("Gear not found");
        }
        const reservation = userId
            ? await reserveGearForTripForUser(supabase, userId, trip_id, gear_id)
            : (await supabase
                .from("trip_gear")
                .insert({ trip_id, gear_id })
                .select()
                .single()).data;
        return jsonResult({
            success: true,
            message: `${gear.brand} ${gear.name} (${gear.type}) reserved for trip "${trip.title}"`,
            reservation: {
                id: reservation.id,
                trip_title: trip.title,
                gear: `${gear.brand} ${gear.name}`,
                gear_type: gear.type,
            },
        });
    }
    async function removeGearReservation(args) {
        const { trip_id, gear_id } = args;
        if (!trip_id || !gear_id) {
            throw new Error("trip_id and gear_id are required");
        }
        const { data: reservation, error: fetchError } = await supabase
            .from("trip_gear")
            .select(`
        trips (title),
        gear (name, brand, type)
      `)
            .eq("trip_id", trip_id)
            .eq("gear_id", gear_id)
            .single();
        if (fetchError || !reservation) {
            throw new Error("Gear reservation not found for this trip");
        }
        const reservationData = reservation;
        const tripTitle = reservationData.trips[0]?.title || "";
        const gearName = reservationData.gear[0]?.name || "";
        const gearBrand = reservationData.gear[0]?.brand || "";
        const gearType = reservationData.gear[0]?.type || "";
        if (userId) {
            await removeGearReservationForUser(supabase, userId, trip_id, gear_id);
        }
        else {
            const { error: deleteError } = await supabase
                .from("trip_gear")
                .delete()
                .eq("trip_id", trip_id)
                .eq("gear_id", gear_id);
            if (deleteError) {
                throw new Error(`Failed to remove gear reservation: ${deleteError.message}`);
            }
        }
        return jsonResult({
            success: true,
            message: `Removed ${gearBrand} ${gearName} (${gearType}) from trip "${tripTitle}"`,
            removed_reservation: {
                gear: `${gearBrand} ${gearName}`,
                gear_type: gearType,
                trip: tripTitle,
            },
        });
    }
    return {
        createGear,
        listGear,
        editGear,
        deleteGear,
        getGearStats,
        reserveGearForTrip,
        removeGearReservation,
    };
}
