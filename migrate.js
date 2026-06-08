const db = new (require('better-sqlite3'))('dev.db');
const colsT = db.prepare('PRAGMA table_info(fact_transacciones)').all();
const colsC = db.prepare('PRAGMA table_info(fact_compras_cuotas)').all();
console.log('Transacciones:', colsT.map(c => c.name));
console.log('Compras Cuotas:', colsC.map(c => c.name));
db.close();
