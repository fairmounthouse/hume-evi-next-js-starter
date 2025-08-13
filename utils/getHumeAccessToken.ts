import 'server-only';

import { fetchAccessToken } from "hume";

export const getHumeAccessToken = async () => {
  const apiKey = process.env.HUME_API_KEY;
  const secretKey = process.env.HUME_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Missing required environment variables (HUME_API_KEY or HUME_SECRET_KEY)');
  }

  try {
    console.log("🔑 Fetching Hume access token...");
    const accessToken = await fetchAccessToken({
      apiKey: String(process.env.HUME_API_KEY),
      secretKey: String(process.env.HUME_SECRET_KEY),
    });

    if (!accessToken || accessToken === "undefined" || accessToken === "null") {
      console.error("❌ Invalid access token received:", accessToken);
      throw new Error('Unable to get valid access token from Hume API');
    }

    console.log("✅ Successfully retrieved Hume access token");
    return accessToken;
  } catch (error) {
    console.error("❌ Error fetching Hume access token:", error);
    
    // Check if it's a network/API error
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new Error('Network error connecting to Hume API. Please check your internet connection.');
      }
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        throw new Error('Invalid Hume API credentials. Please check your HUME_API_KEY and HUME_SECRET_KEY.');
      }
    }
    
    throw new Error(`Failed to get Hume access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
