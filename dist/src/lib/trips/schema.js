import * as z from "zod";
export const tripSchema = z
    .object({
    title: z.string().min(1),
    description: z.string().min(1),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
})
    .refine((data) => {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return endDate >= startDate;
}, {
    message: "End date must be on or after start date",
    path: ["end_date"],
});
