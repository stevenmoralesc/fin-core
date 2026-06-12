const db = require('better-sqlite3')('dev.db');
const id = '5ba1fcd1-81ea-4dba-8119-909859de890c';
db.prepare("UPDATE fact_transacciones SET date = '2026-06-01' WHERE id = ?").run(id);
const rows = db.prepare('SELECT id, date FROM fact_transacciones WHERE id = ?').all(id);
console.log(rows);
