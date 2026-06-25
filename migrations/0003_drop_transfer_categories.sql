-- Las transferencias internas (entre cuentas propias) no necesitan
-- categoría: el evento queda completamente descrito por las cuentas
-- origen y destino. Limpiamos las entradas de sys_config con
-- transactionType='TRANSFERENCIA' que se volvieron obsoletas. Las
-- transacciones existentes guardan category='Transferencia' como
-- sentinel y siguen funcionando — la UI ya no permite crear ni editar
-- categorías de transferencia.

DELETE FROM sys_config WHERE transactionType = 'TRANSFERENCIA';
