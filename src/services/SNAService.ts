import { SNAAPI } from '../api/sna';
import axios from 'axios';

export const SNAService = {
  authenticate: async (phoneNumber: string) => {
    try {
      // 1. Request SNA challenge and URL
      const { challenge, url } = await SNAAPI.loginRequest(phoneNumber);

      // 2. Perform SNA Authentication (calling the URL via cellular data)
      try {
        await axios.get(url, { timeout: 10000 });
      } catch (error) {
        // Many SNA flows might return a 302 or similar which axios might treat as error
        // or it might just be a headless check.
      }

      // 3. Verify Authentication
      const result = await SNAAPI.verify(challenge);
      return result;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('SNA failed: Ensure you are on mobile data and Wi-Fi is off.');
      }
      throw error;
    }
  },
};
