const fs = require('fs');

let schema = fs.readFileSync('drizzle/schema.ts', 'utf8');

// Replace imports
schema = schema.replace(/"drizzle-orm\/mysql-core"/g, '"drizzle-orm/pg-core"');
schema = schema.replace(/mysqlTable/g, 'pgTable');

// Replace auto-increments
// int("id").autoincrement() -> serial("id")
schema = schema.replace(/int\("id"\)\.autoincrement\(\)/g, 'serial("id")');

// Replace mysqlEnum
// mysqlEnum("role", ["user", "admin"]) -> varchar("role", { length: 50, enum: ["user", "admin"] })
// Actually, it's easier to just use text("role", { enum: [...] }) in drizzle pg?
// Yes, text has enum: text('role', { enum: ['admin', 'user'] })
schema = schema.replace(/mysqlEnum\(([^,]+),\s*(\[[^\]]+\])\)/g, (match, p1, p2) => {
  return `varchar(${p1}, { length: 255, enum: ${p2} })`;
});

// Replace types
// int -> integer
schema = schema.replace(/\bint\(/g, 'integer(');
// float -> doublePrecision
schema = schema.replace(/\bfloat\(/g, 'doublePrecision(');

// Add missing imports
schema = schema.replace(/import {/, 'import { pgTable, serial, integer, doublePrecision, varchar, text, timestamp, boolean, json, bigint, index } from "drizzle-orm/pg-core";\n//import {');

fs.writeFileSync('drizzle/schema.ts', schema);
console.log('Schema converted');
