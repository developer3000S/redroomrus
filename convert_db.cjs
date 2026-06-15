const fs = require('fs');

let db = fs.readFileSync('server/db.ts', 'utf8');

// Replace imports
db = db.replace(/import \{ drizzle \} from "drizzle-orm\/mysql2";/g, 'import { drizzle } from "drizzle-orm/postgres-js";');
db = db.replace(/import mysql from "mysql2";/g, 'import postgres from "postgres";');

// Replace pool
db = db.replace(/let _pool: ReturnType<typeof mysql\.createPool> \| null = null;/g, 'let _pool: ReturnType<typeof postgres> | null = null;');

db = db.replace(/_pool = mysql\.createPool\(\{[\s\S]*?\}\);/g, `_pool = postgres(process.env.DATABASE_URL, {
        max: 20,                // Max connections in pool
        idle_timeout: 60,       // Close idle connections after 60s
      });`);

// Fix duplicate key updates
// PostgreSQL requires specifying the target (the unique constraint or primary key) for ON CONFLICT.
// In users:
db = db.replace(/\.onDuplicateKeyUpdate\(\{ set: updateSet \}\)/, '.onConflictDoUpdate({ target: users.openId, set: updateSet })');

// In newsAgencies upsert:
db = db.replace(/\.onDuplicateKeyUpdate\(\{ set: \{ updatedAt: new Date\(\) \} \}\)/, '.onConflictDoNothing()');

// In bulkInsertNewsAgencies
db = db.replace(/\.onDuplicateKeyUpdate\(\{ set: \{ name: agency\.name, updatedAt: new Date\(\) \} \}\)/, '.onConflictDoNothing()');

// In bulkInsertFacilities
db = db.replace(/\.onDuplicateKeyUpdate\(\{ set: \{ name: fac\.name, updatedAt: new Date\(\) \} \}\)/, '.onConflictDoNothing()');

// In upsertSatellite
db = db.replace(/\.onDuplicateKeyUpdate\(\{[\s\S]*?\}\)/, '.onConflictDoUpdate({ target: satellites.noradId, set: { name: sat.name, tle1: sat.tle1, tle2: sat.tle2, category: sat.category, country: sat.country, launchDate: sat.launchDate, launchSite: sat.launchSite, missionDescription: sat.missionDescription, operator: sat.operator, altitude: sat.altitude, inclination: sat.inclination, period: sat.period, eccentricity: sat.eccentricity, lastUpdated: new Date() } })');

// Fix ER_DUP_ENTRY to postgres unique violation error code '23505'
db = db.replace(/e\.code === 'ER_DUP_ENTRY'/g, "e.code === '23505'");

fs.writeFileSync('server/db.ts', db);
console.log('db.ts converted');
