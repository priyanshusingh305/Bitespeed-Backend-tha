import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../models/contact";
import config from "../config/config";

const pool = new Pool({
	connectionString: config.databaseUrl ?? "",
});

pool
	.connect()
	.then(() => console.log("✅ Connected to PostgreSQL"))
	.catch((err) => {
		console.error("❌ Failed to connect to DB:", err);
		process.exit(1);
	});

export const db = drizzle(pool, { schema });

export * from "../models/contact";
