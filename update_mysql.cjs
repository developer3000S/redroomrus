const fs = require('fs');

function replaceFile(path, replacer) {
  if (fs.existsSync(path)) {
    const text = fs.readFileSync(path, 'utf8');
    const newText = replacer(text);
    if (text !== newText) {
      fs.writeFileSync(path, newText);
      console.log(`Updated ${path}`);
    }
  }
}

replaceFile('server/narrativeEngine.ts', text => {
  let res = text.replace(/import mysql from "mysql2\/promise";/, 'import postgres from "postgres";');
  res = res.replace(/let _rawPool: mysql\.Pool \| null = null;/, 'let _rawPool: ReturnType<typeof postgres> | null = null;');
  res = res.replace(/function getRawPool\(\): mysql\.Pool \{/, 'function getRawPool() {');
  res = res.replace(/_rawPool = mysql\.createPool\(process\.env\.DATABASE_URL!\);/, '_rawPool = postgres(process.env.DATABASE_URL!);');
  
  // replace await pool.execute with await pool.unsafe
  // const [articles] = await pool.execute( ... ) as [Array<...>, unknown]
  // becomes const articles = await pool.unsafe( ... ) as Array<...>
  res = res.replace(/const \[articles\] = await pool\.execute\(`([\s\S]*?)`, regionParams\) as \[Array<([^>]+)>, unknown\];/g, 'const articles = await pool.unsafe(`$1`, regionParams) as Array<$2>;');
  res = res.replace(/const \[artRows\] = await pool\.execute\(\n\s*`([\s\S]*?)`,\n\s*\[articleId\]\n\s*\) as \[Array<([^>]+)>, unknown\];/g, 'const artRows = await pool.unsafe(`$1`, [articleId]) as Array<$2>;');
  res = res.replace(/const \[narratives\] = await pool\.execute\(\n\s*`([\s\S]*?)`,\n\s*regionNarrativeParams\n\s*\) as \[Array<([^>]+)>, unknown\];/g, 'const narratives = await pool.unsafe(`$1`, regionNarrativeParams) as Array<$2>;');
  res = res.replace(/const \[narRows\] = await pool\.execute\(\n\s*`([\s\S]*?)`,\n\s*\[narrativeId\]\n\s*\) as \[Array<([^>]+)>, unknown\];/g, 'const narRows = await pool.unsafe(`$1`, [narrativeId]) as Array<$2>;');
  res = res.replace(/const \[artRows\] = await pool\.execute\(\n\s*`([\s\S]*?)`,\n\s*regionParam\n\s*\) as \[Array<([^>]+)>, unknown\];/g, 'const artRows = await pool.unsafe(`$1`, regionParam) as Array<$2>;');
  
  res = res.replace(/await pool\.execute\(\n\s*`INSERT INTO([\s\S]*?)VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)([\s\S]*?)`,\n\s*\[([\s\S]*?)\]\n\s*\);/g, 'await pool.unsafe(`INSERT INTO$1VALUES ($1, $2, $3, $4, $5, $6, $7, $8)$2`, [$3]);'); // simplistic replacement, but wait ON DUPLICATE KEY UPDATE needs ON CONFLICT DO UPDATE
  
  res = res.replace(/ON DUPLICATE KEY UPDATE/g, 'ON CONFLICT DO UPDATE');
  res = res.replace(/VALUES\(([a-zA-Z]+)\)/g, 'EXCLUDED.$1');
  
  return res;
});

replaceFile('server/routers/narratives.ts', text => {
  let res = text.replace(/import mysql from "mysql2\/promise";/, 'import postgres from "postgres";');
  res = res.replace(/let _pool: mysql\.Pool \| null = null;/, 'let _pool: ReturnType<typeof postgres> | null = null;');
  res = res.replace(/function getPool\(\): mysql\.Pool \{/, 'function getPool() {');
  res = res.replace(/if \(!_pool\) _pool = mysql\.createPool\(process\.env\.DATABASE_URL!\);/, 'if (!_pool) _pool = postgres(process.env.DATABASE_URL!);');
  
  res = res.replace(/const \[linkRows\] = await pool\.query<mysql\.RowDataPacket\[\]>\(/, 'const linkRows = await pool.unsafe(');
  res = res.replace(/\) as any;/, ') as any;');
  
  return res;
});

replaceFile('server/routers/sigint.ts', text => {
  return text.replace(/drizzle-orm\/mysql2/g, 'drizzle-orm/postgres-js');
});

replaceFile('server/routers/waitingList.ts', text => {
  let res = text.replace(/import mysql from "mysql2\/promise";/, 'import postgres from "postgres";');
  res = res.replace(/let _pool: mysql\.Pool \| null = null;/, 'let _pool: ReturnType<typeof postgres> | null = null;');
  res = res.replace(/function getPool\(\): mysql\.Pool \{/, 'function getPool() {');
  res = res.replace(/if \(!_pool\) _pool = mysql\.createPool\(process\.env\.DATABASE_URL!\);/, 'if (!_pool) _pool = postgres(process.env.DATABASE_URL!);');
  
  res = res.replace(/const \[existing\] = await pool\.query<mysql\.RowDataPacket\[\]>\(/, 'const existing = await pool.unsafe(');
  res = res.replace(/const \[rows\] = await pool\.query<mysql\.RowDataPacket\[\]>\(/g, 'const rows = await pool.unsafe(');
  res = res.replace(/const \[countRows\] = await pool\.query<mysql\.RowDataPacket\[\]>\(/, 'const countRows = await pool.unsafe(');
  
  return res;
});

const seeds = ['server/seed-articles.ts', 'server/seed-comprehensive.ts', 'server/seed-real-articles.ts', 'server/seed.ts'];
seeds.forEach(s => {
  replaceFile(s, text => text.replace(/drizzle-orm\/mysql2/g, 'drizzle-orm/postgres-js'));
});

replaceFile('server/seed-satellites.mjs', text => {
  let res = text.replace(/import \{ createConnection \} from "mysql2\/promise";/, 'import postgres from "postgres";');
  res = res.replace(/const connection = await createConnection\(process\.env\.DATABASE_URL\);/, 'const connection = postgres(process.env.DATABASE_URL);');
  res = res.replace(/await connection\.execute\(/g, 'await connection.unsafe(');
  res = res.replace(/await connection\.end\(\);/, 'await connection.end();');
  res = res.replace(/ON DUPLICATE KEY UPDATE/g, 'ON CONFLICT (noradId) DO UPDATE SET');
  res = res.replace(/VALUES\(([a-zA-Z0-9]+)\)/g, 'EXCLUDED.$1');
  return res;
});

console.log("Replacements complete");
