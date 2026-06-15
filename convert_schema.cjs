const fs = require('fs');

let schema = fs.readFileSync('drizzle/schema.ts', 'utf8');

// Replace imports
schema = schema.replace(/"drizzle-orm\/mysql-core"/g, '"drizzle-orm/pg-core"');
schema = schema.replace(/mysqlTable/g, 'pgTable');

// Replace auto-increments
// int("id").autoincrement() -> serial("id")
schema = schema.replace(/int\("id"\)\.autoincrement\(\)/g, 'serial("id")');

// Replace mysqlEnum
schema = schema.replace(/mysqlEnum\(([^,]+),\s*(\[[^\]]+\])\)/g, (match, p1, p2) => {
  return `varchar(${p1}, { length: 255, enum: ${p2} })`;
});

// Replace types
schema = schema.replace(/\bint\(/g, 'integer(');
schema = schema.replace(/\bfloat\(/g, 'doublePrecision(');

// Clean up imports block at top and add new ones
schema = schema.replace(/import \{([\s\S]*?)\} from "drizzle-orm\/pg-core";/, 'import { pgTable, serial, integer, doublePrecision, varchar, text, timestamp, boolean, json, bigint, index } from "drizzle-orm/pg-core";');

// Drizzle PG timestamps don't have .onUpdateNow(). 
// Remove .onUpdateNow()
schema = schema.replace(/\.onUpdateNow\(\)/g, '');

// Drizzle PG json b
// postgres jsonb is better, let's replace json with jsonb
schema = schema.replace(/\bjson\(/g, 'jsonb(');
schema = schema.replace(/\bjson, /g, 'jsonb, ');

// Fix imports again if jsonb is missing
schema = schema.replace(/json,/g, 'jsonb,');

fs.writeFileSync('drizzle/schema.ts', schema);
console.log('Schema converted');
