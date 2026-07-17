/** Parámetros del producto de predicción (calibrados con backtest). */

/**
 * Umbral del tier "Pick Seguro": probabilidad mínima para etiquetar un pick
 * como de certeza extrema. Backtest 7 días / 241 partidos (2026-07-16):
 * los picks ≥85% acertaron 91.7% (n=24). Re-validar con /api/admin/backtest
 * después de cada cambio del motor.
 */
export const SAFE_PICK_THRESHOLD = 85;

export function isSafePick(probability: number): boolean {
  return probability >= SAFE_PICK_THRESHOLD;
}
