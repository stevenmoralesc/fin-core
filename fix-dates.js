const db = require('better-sqlite3')('dev.db');
db.prepare("UPDATE fact_transacciones SET date = substr(date, 1, 10) WHERE length(date) > 10;").run();
db.prepare("UPDATE fact_compras_cuotas SET purchaseDate = substr(purchaseDate, 1, 10) WHERE length(purchaseDate) > 10;").run();
console.log('Fixed DB dates');
