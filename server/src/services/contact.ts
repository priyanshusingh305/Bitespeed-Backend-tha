import { db } from "../db";
import { contacts } from "../models/contact";
import type { Contact, LinkPrecedence } from "../models/contact";
import { eq, or, and, isNull } from "drizzle-orm";

interface ConsolidatedContact {
	primaryContatctId: number;
	emails: string[];
	phoneNumbers: string[];
	secondaryContactIds: number[];
}

export const ContactService = {
	async identifyAndConsolidateContact(email?: string, phoneNumber?: string): Promise<ConsolidatedContact> {
		const existingContacts = await ContactService.findExistingContacts(email, phoneNumber);

		let primaryContact: Contact;
		let allRelatedContacts: Contact[] = [];

		if (existingContacts.length === 0) {
			primaryContact = await ContactService.createNewPrimaryContact(email, phoneNumber);
			allRelatedContacts = [primaryContact];
		} else if (existingContacts.length === 1) {
			const existingContact = existingContacts[0];

			const needsSecondaryContact = ContactService.needsSecondaryContact(existingContact, email, phoneNumber);

			if (needsSecondaryContact) {
				primaryContact = await ContactService.findPrimaryContact(existingContact);

				await ContactService.createSecondaryContact(email, phoneNumber, primaryContact.id);

				allRelatedContacts = await ContactService.getAllRelatedContacts(primaryContact.id);
			} else {
				primaryContact = await ContactService.findPrimaryContact(existingContact);
				allRelatedContacts = await ContactService.getAllRelatedContacts(primaryContact.id);
			}
		} else {
			primaryContact = await ContactService.mergeContacts(existingContacts, email, phoneNumber);
			allRelatedContacts = await ContactService.getAllRelatedContacts(primaryContact.id);
		}

		return ContactService.buildConsolidatedResponse(primaryContact, allRelatedContacts);
	},

	async findExistingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
		return await db
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
	},

	async createNewPrimaryContact(email?: string, phoneNumber?: string): Promise<Contact> {
		const [newContact] = await db
			.insert(contacts)
			.values({
				email,
				phoneNumber,
				linkedId: null,
				linkPrecedence: "primary" as LinkPrecedence,
			})
			.returning();

		return newContact;
	},

	needsSecondaryContact(existingContact: Contact, email?: string, phoneNumber?: string): boolean {
		return (
			(email !== undefined && existingContact.email !== email) ||
			(phoneNumber !== undefined && existingContact.phoneNumber !== phoneNumber)
		);
	},

	async createSecondaryContact(email?: string, phoneNumber?: string, primaryContactId?: number): Promise<Contact> {
		const [newSecondaryContact] = await db
			.insert(contacts)
			.values({
				email,
				phoneNumber,
				linkedId: primaryContactId,
				linkPrecedence: "secondary" as LinkPrecedence,
			})
			.returning();

		return newSecondaryContact;
	},

	async findPrimaryContact(contact: Contact): Promise<Contact> {
		if (contact.linkPrecedence === "primary") {
			return contact;
		}

		if (contact.linkedId) {
			const [primaryContact] = await db.select().from(contacts).where(eq(contacts.id, contact.linkedId));
			return primaryContact;
		}

		return contact;
	},

	async getAllRelatedContacts(primaryContactId: number): Promise<Contact[]> {
		const allContacts = await db
			.select()
			.from(contacts)
			.where(
				and(isNull(contacts.deletedAt), or(eq(contacts.id, primaryContactId), eq(contacts.linkedId, primaryContactId))),
			);

		return allContacts;
	},

	async mergeContacts(existingContacts: Contact[], email?: string, phoneNumber?: string): Promise<Contact> {
		const oldestContact = existingContacts.reduce((oldest, current) =>
			new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current,
		);

		await ContactService.updateContactsToSecondary(existingContacts, oldestContact);

		await ContactService.createSecondaryContactIfNeeded(existingContacts, oldestContact.id, email, phoneNumber);

		return oldestContact;
	},

	async updateContactsToSecondary(existingContacts: Contact[], primaryContact: Contact): Promise<void> {
		const contactsToUpdate = existingContacts.filter((c) => c.id !== primaryContact.id);

		for (const contact of contactsToUpdate) {
			await db
				.update(contacts)
				.set({
					linkedId: primaryContact.id,
					linkPrecedence: "secondary" as LinkPrecedence,
					updatedAt: new Date(),
				})
				.where(eq(contacts.id, contact.id));
		}
	},

	async createSecondaryContactIfNeeded(
		existingContacts: Contact[],
		primaryContactId: number,
		email?: string,
		phoneNumber?: string,
	): Promise<void> {
		const hasNewInfo =
			(email && !existingContacts.some((c) => c.email === email)) ||
			(phoneNumber && !existingContacts.some((c) => c.phoneNumber === phoneNumber));

		if (hasNewInfo) {
			await ContactService.createSecondaryContact(email, phoneNumber, primaryContactId);
		}
	},

	buildConsolidatedResponse(primaryContact: Contact, allContacts: Contact[]): ConsolidatedContact {
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
	},
};
