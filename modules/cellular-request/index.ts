import { requireNativeModule } from 'expo-modules-core';

interface CellularRequestResponse {
  status: number;
  body: string;
}

interface CellularRequestModuleType {
  triggerCellularGet(url: string): Promise<CellularRequestResponse>;
}

const CellularRequestModule = requireNativeModule<CellularRequestModuleType>('CellularRequest');

/**
 * Executes an HTTP GET request to the specified URL forced over the cellular/mobile network.
 * Used for carrier Silent Network Authentication checks.
 *
 * @param url The URL to hit.
 * @returns The HTTP response status code and response body.
 */
export async function triggerCellularGet(url: string): Promise<CellularRequestResponse> {
  return await CellularRequestModule.triggerCellularGet(url);
}
