const db = require('better-sqlite3')('dev.db');
const rows = db.prepare("SELECT id, date, typeof(date) as t, length(date) as l FROM fact_transacciones WHERE description LIKE '%carnes%'").all();
console.log(rows);
