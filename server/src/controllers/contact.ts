import type { Request, Response } from "express";
import {
	identifyRequestSchema,
	paginationQuerySchema,
} from "../schemas/contact";
import { ContactService } from "../services/contact";

export async function identifyContact(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		// Validate request body
		const validationResult = identifyRequestSchema.safeParse(req.body);
		console.log("Validation result:", req.body);

		if (!validationResult.success) {
			res.status(400).json({
				error: "Invalid request data",
				details: validationResult.error.errors,
			});
			return;
		}

		const { email, phoneNumber } = validationResult.data;

		// Delegate business logic to service
		const consolidatedContact =
			await ContactService.identifyAndConsolidateContact(email, phoneNumber);

		res.status(200).json({ contact: consolidatedContact });
	} catch (error) {
		console.error("Error in identifyContact:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}

export async function getAllContacts(
	req: Request,
	res: Response,
): Promise<void> {
	try {
		const validationResult = paginationQuerySchema.safeParse(req.query);

		if (!validationResult.success) {
			res.status(400).json({
				error: "Invalid query parameters",
				details: validationResult.error.errors,
			});
			return;
		}

		const { page, limit } = validationResult.data;
		const result = await ContactService.getPaginatedContacts(page, limit);

		res.status(200).json(result);
	} catch (error) {
		console.error("Error in getAllContacts:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}
