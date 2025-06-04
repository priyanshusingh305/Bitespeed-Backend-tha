import { pgTable, serial, varchar, timestamp, integer } from "drizzle-orm/pg-core";

// Contacts table
export const contacts = pgTable("contacts", {
	id: serial("id").primaryKey(),
	phoneNumber: varchar("phone_number", { length: 20 }),
	email: varchar("email", { length: 255 }),
	linkedId: integer("linked_id"),
	linkPrecedence: varchar("link_precedence", { length: 20 }).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	deletedAt: timestamp("deleted_at"),
});

// Types for TypeScript
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type LinkPrecedence = "primary" | "secondary";
