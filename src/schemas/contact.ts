import { z } from "zod";

export const identifyRequestSchema = z
	.object({
		email: z.string().email().optional(),
		phoneNumber: z.string().min(1).optional(),
	})
	.refine((data) => data.email || data.phoneNumber, {
		message: "Either email or phoneNumber must be provided",
		path: ["email", "phoneNumber"],
	});

export const identifyResponseSchema = z.object({
	contact: z.object({
		primaryContatctId: z.number(),
		emails: z.array(z.string()),
		phoneNumbers: z.array(z.string()),
		secondaryContactIds: z.array(z.number()),
	}),
});

export type IdentifyRequest = z.infer<typeof identifyRequestSchema>;
export type IdentifyResponse = z.infer<typeof identifyResponseSchema>;
