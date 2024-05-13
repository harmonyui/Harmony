import { z } from "zod";

export const changeLogSchema = z.object({
    releaseDate: z.date(),
    version: z.string(),
    bugs: z.string(),
    features: z.string()
});

export type ChangeLog = z.infer<typeof changeLogSchema>;