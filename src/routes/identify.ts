import type { Request, Response } from "express";
import { db } from "../db";
import { contacts } from "../models/contact";
import type { Contact, LinkPrecedence } from "../models/contact";
import { identifyRequestSchema, IdentifyResponse } from "../schemas/contact";
import { eq, or, and, isNull } from "drizzle-orm";

interface ConsolidatedContact {
	primaryContatctId: number;
	emails: string[];
	phoneNumbers: string[];
	secondaryContactIds: number[];
}

export async function identifyContact(req: Request, res: Response): Promise<void> {
	try {
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

		const existingContacts: Contact[] = await db
			.select()
			.from(contacts)
			.where(
				and(
					isNull(contacts.deletedAt),
					or(
						email ? eq(contacts.email, email) : undefined,
						phoneNumber ? eq(contacts.phoneNumber, phoneNumber) : undefined,
					),
				),
			);

		let primaryContact: Contact;
		let allRelatedContacts: Contact[] = [];

		if (existingContacts.length === 0) {
			const [newContact] = await db
				.insert(contacts)
				.values({
					email,
					phoneNumber,
					linkedId: null,
					linkPrecedence: "primary" as LinkPrecedence,
				})
				.returning();

			primaryContact = newContact;
			allRelatedContacts = [newContact];
		} else if (existingContacts.length === 1) {
			const existingContact = existingContacts[0];

			const needsSecondaryContact =
				(email && existingContact.email !== email) || (phoneNumber && existingContact.phoneNumber !== phoneNumber);

			if (needsSecondaryContact) {
				primaryContact = await findPrimaryContact(existingContact);

				const [newSecondaryContact] = await db
					.insert(contacts)
					.values({
						email,
						phoneNumber,
						linkedId: primaryContact.id,
						linkPrecedence: "secondary" as LinkPrecedence,
					})
					.returning();

				allRelatedContacts = await getAllRelatedContacts(primaryContact.id);
			} else {
				primaryContact = await findPrimaryContact(existingContact);
				allRelatedContacts = await getAllRelatedContacts(primaryContact.id);
			}
		} else {
			primaryContact = await mergeContacts(existingContacts, email, phoneNumber);
			allRelatedContacts = await getAllRelatedContacts(primaryContact.id);
		}

		const response = buildConsolidatedResponse(primaryContact, allRelatedContacts);

		res.status(200).json({ contact: response });
	} catch (error) {
		console.error("Error in identifyContact:", error);
		res.status(500).json({ error: "Internal server error" });
	}
}

async function findPrimaryContact(contact: Contact): Promise<Contact> {
	if (contact.linkPrecedence === "primary") {
		return contact;
	}

	if (contact.linkedId) {
		const [primaryContact] = await db.select().from(contacts).where(eq(contacts.id, contact.linkedId));
		return primaryContact;
	}

	return contact;
}

async function getAllRelatedContacts(primaryContactId: number): Promise<Contact[]> {
	const allContacts = await db
		.select()
		.from(contacts)
		.where(
			and(isNull(contacts.deletedAt), or(eq(contacts.id, primaryContactId), eq(contacts.linkedId, primaryContactId))),
		);

	return allContacts;
}

async function mergeContacts(existingContacts: Contact[], email?: string, phoneNumber?: string): Promise<Contact> {
	// Find the oldest contact to remain as primary
	const oldestContact = existingContacts.reduce((oldest, current) =>
		new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current,
	);

	// Update other contacts to be secondary
	const contactsToUpdate = existingContacts.filter((c) => c.id !== oldestContact.id);

	for (const contact of contactsToUpdate) {
		await db
			.update(contacts)
			.set({
				linkedId: oldestContact.id,
				linkPrecedence: "secondary" as LinkPrecedence,
				updatedAt: new Date(),
			})
			.where(eq(contacts.id, contact.id));
	}

	// Create new secondary contact if needed
	const hasNewInfo =
		(email && !existingContacts.some((c) => c.email === email)) ||
		(phoneNumber && !existingContacts.some((c) => c.phoneNumber === phoneNumber));

	if (hasNewInfo) {
		await db.insert(contacts).values({
			email,
			phoneNumber,
			linkedId: oldestContact.id,
			linkPrecedence: "secondary" as LinkPrecedence,
		});
	}

	return oldestContact;
}

function buildConsolidatedResponse(primaryContact: Contact, allContacts: Contact[]): ConsolidatedContact {
	const emails = Array.from(
		new Set(allContacts.map((c) => c.email).filter((email): email is string => email !== null)),
	);

	const phoneNumbers = Array.from(
		new Set(allContacts.map((c) => c.phoneNumber).filter((phone): phone is string => phone !== null)),
	);

	const secondaryContactIds = allContacts.filter((c) => c.linkPrecedence === "secondary").map((c) => c.id);

	return {
		primaryContatctId: primaryContact.id,
		emails,
		phoneNumbers,
		secondaryContactIds,
	};
}
