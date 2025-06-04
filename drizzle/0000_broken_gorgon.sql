CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(20),
	"email" varchar(255),
	"linked_id" integer,
	"link_precedence" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
