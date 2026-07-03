import { apiClient } from './axios';
import { API } from '../config/api';
import { TokenRequest, TokenResponse } from '../types/auth';
import { ENV } from '../config/env';
import { Buffer } from 'buffer';
export const AuthApi = {
  getToken: async (_request: TokenRequest): Promise<TokenResponse> => {
    console.log("[TOKEN] START");

    try {
      // Browser btoa() is not available in React Native,
      // so use Buffer (recommended) or a base64 library.
      const authorization =
        "Basic " +
        Buffer.from(
          `${ENV.VERIFY_CLIENT_ID}:${ENV.VERIFY_CLIENT_SECRET}`
        ).toString("base64");

      const body = new URLSearchParams({
        grant_type: "client_credentials",
      }).toString();

      console.log("AUTH HEADER =", authorization);
      console.log("BODY =", body);
      console.log("URL =", API.AUTH.TOKEN);
      console.log("BASE URL =", ENV.API_BASE_URL);
      console.log("CLIENT ID =", ENV.VERIFY_CLIENT_ID);
      console.log("CLIENT SECRET =", ENV.VERIFY_CLIENT_SECRET);

      
      const response = await apiClient.post<TokenResponse>(
        API.AUTH.TOKEN,
        body,
        {
          headers: {
            Authorization: authorization,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
        }
      );

      console.log("[TOKEN] SUCCESS");
      console.log(response.data);

      return response.data;
    } catch (e: any) {
      console.log("================ TOKEN ERROR ================");
      console.log(e);

      if (e?.response) {
        console.log("status:", e.response.status);
        console.log(
          "data:",
          JSON.stringify(e.response.data, null, 2)
        );
      }

      throw e;
    }
  },
};