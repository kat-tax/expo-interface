import {uuidv4} from '../uuid';

/**
 * `EASClient`, what `expo-eas-client` reads at import: the id EAS services
 * know this installation by, and a value in [0, 1) derived from it for
 * deterministic rollouts. Native platforms keep the id in storage; until the
 * runtime has a store of its own the id is new at every launch, which is
 * what an installation with no storage yet looks like.
 */
export const EAS_CLIENT_ID = uuidv4();

/** The first 52 bits of the id's hex, as a fraction of their range. */
export function deterministicUniformValue(id: string): number {
  const hex = id.replace(/-/g, '').slice(0, 13);
  return Number.parseInt(hex, 16) / 2 ** 52;
}

export const EASClient = {
  get clientID(): string {
    return EAS_CLIENT_ID;
  },
  get deterministicUniformValue(): number {
    return deterministicUniformValue(EAS_CLIENT_ID);
  },
};
