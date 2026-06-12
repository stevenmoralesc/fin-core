const db = require('better-sqlite3')('dev.db');
const trans = db.prepare("SELECT id, date FROM fact_transacciones WHERE length(date) > 10").all();
for (const t of trans) {
  const shortDate = String(t.date).substring(0, 10);
  db.prepare("UPDATE fact_transacciones SET date = ? WHERE id = ?").run(shortDate, t.id);
}

const quotas = db.prepare("SELECT id, purchaseDate FROM fact_compras_cuotas WHERE length(purchaseDate) > 10").all();
for (const q of quotas) {
  const shortDate = String(q.purchaseDate).substring(0, 10);
  db.prepare("UPDATE fact_compras_cuotas SET purchaseDate = ? WHERE id = ?").run(shortDate, q.id);
}
console.log('Fixed DB dates via loop');
