-- ─────────────────────────────────────────────────────────────
--  0002_money_to_cents — el dinero pasa a enteros en centavos
--
--  Convierte los montos existentes (unidades decimales) a centavos
--  enteros (valor × 100), eliminando el punto flotante en saldos y
--  agregados. monthlyInterest NO se toca: es un porcentaje, no dinero.
--
--  Nota: en SQLite la afinidad de columna sigue siendo REAL, pero al
--  guardar enteros < 2^53 el valor es exacto. La app trata siempre
--  estos campos como centavos enteros (ver src/lib/money.ts).
--  Esta migración corre una sola vez (registrada en _migrations).
-- ─────────────────────────────────────────────────────────────

UPDATE dim_cuentas
   SET initialBalance = CAST(ROUND(initialBalance * 100) AS INTEGER);

UPDATE dim_tarjetas_credito
   SET totalLimit = CAST(ROUND(totalLimit * 100) AS INTEGER);

UPDATE fact_transacciones
   SET amount = CAST(ROUND(amount * 100) AS INTEGER);

UPDATE fact_compras_cuotas
   SET totalAmount = CAST(ROUND(totalAmount * 100) AS INTEGER);

UPDATE sys_config
   SET suggestedBudget = CAST(ROUND(suggestedBudget * 100) AS INTEGER);
