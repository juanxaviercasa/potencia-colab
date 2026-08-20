/** Política explícita de aislamiento para un centro de entrenamiento de un único propietario. */
export function isPersonalOwner(openId: string | null | undefined, ownerOpenId: string | null | undefined) {
  return Boolean(openId && ownerOpenId && openId === ownerOpenId);
}
