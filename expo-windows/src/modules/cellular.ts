/**
 * `ExpoCellular`, what `expo-cellular` reads. A desktop has no carrier, so
 * every value is `null` and the generation unknown — what the package's web
 * module answers for a browser without a connection type. The permission
 * calls are Android's; the package answers them itself elsewhere.
 */
export const CELLULAR_GENERATION_UNKNOWN = 0;

export const ExpoCellular = {
  get allowsVoip(): null {
    return null;
  },
  get carrier(): null {
    return null;
  },
  get isoCountryCode(): null {
    return null;
  },
  get mobileCountryCode(): null {
    return null;
  },
  get mobileNetworkCode(): null {
    return null;
  },
  async getCellularGenerationAsync(): Promise<number> {
    return CELLULAR_GENERATION_UNKNOWN;
  },
  async allowsVoipAsync(): Promise<null> {
    return null;
  },
  async getIsoCountryCodeAsync(): Promise<null> {
    return null;
  },
  async getCarrierNameAsync(): Promise<null> {
    return null;
  },
  async getMobileCountryCodeAsync(): Promise<null> {
    return null;
  },
  async getMobileNetworkCodeAsync(): Promise<null> {
    return null;
  },
};
