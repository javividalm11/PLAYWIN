/** Reglas de negocio del trial y suscripción — un solo lugar. */

export const ACCESS_RULES = {
  /** Días de prueba anónima (por IP + fingerprint) desde el primer uso. */
  anonTrialDays: 3,
  /** Días extra al registrarse (corren desde que expira lo anterior o desde el registro). */
  registeredExtraDays: 2,
  /** Precio de la suscripción mensual en USD (informativo para UI). */
  monthlyPriceUsd: 9,
} as const;

export type AccessTier = "dev-open" | "anon-trial" | "registered-trial" | "paid";

export type AccessResult = {
  allowed: boolean;
  tier: AccessTier | "denied";
  /** Días restantes de acceso (0 si denegado, null si ilimitado/paid). */
  daysLeft: number | null;
  /** Qué debe hacer el usuario para recuperar acceso. */
  nextStep: "none" | "register" | "subscribe";
};
