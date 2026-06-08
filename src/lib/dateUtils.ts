/**
 * Ajusta la fecha de corte de una tarjeta si cae en fin de semana.
 * Regla bancaria: Si el día cae sábado o domingo, se corre al viernes anterior.
 *
 * @param year Año
 * @param month Mes (1-12)
 * @param targetDay Día de corte (1-31)
 * @returns Fecha ajustada
 */
export function getAdjustedClosingDate(year: number, month: number, targetDay: number): Date {
  // JavaScript Date usa meses de 0-11
  let date = new Date(year, month - 1, targetDay);
  
  // Si targetDay excede los días del mes (ej. Feb 30), JS lo pasa al siguiente mes.
  // En tarjetas, si el día es 31 y el mes tiene 30, el corte es el 30.
  // Validamos si el mes saltó:
  if (date.getMonth() !== month - 1) {
    // Retrocedemos al último día del mes deseado
    date = new Date(year, month, 0);
  }

  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

  if (dayOfWeek === 6) {
    // Sábado -> restar 1 día
    date.setDate(date.getDate() - 1);
  } else if (dayOfWeek === 0) {
    // Domingo -> restar 2 días
    date.setDate(date.getDate() - 2);
  }

  return date;
}
