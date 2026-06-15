
const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-U6KfueDjHDXPpg59tXTi6Ufr';

const getOptions = () => ({
  method: 'GET',
});

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large: string;
}

export const searchCoins = async (query: string): Promise<CoinSearchResult[]> => {
  if (!query || query.length < 2) return [];
  try {
    // Public endpoint for search (no key to avoid 400/403 on some key types)
    const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
    
    const res = await fetch(url, getOptions());
    
    if (!res.ok) {
        throw new Error(`Status: ${res.status}`);
    }
    const data = await res.json();
    return data.coins || [];
  } catch (error) {
    console.error("CoinGecko Search Error:", error);
    return [];
  }
};

export const getCoinPrices = async (ids: string[]): Promise<Record<string, { usd: number }>> => {
  const cleanIds = ids.filter(id => !!id);
  if (cleanIds.length === 0) return {};
  
  const idsParam = cleanIds.join(',');

  const fetchWithKey = async () => {
      const url = `${BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd&x_cg_demo_api_key=${API_KEY.trim()}`;
      const res = await fetch(url, getOptions());
      if (!res.ok) throw new Error(res.status.toString());
      return await res.json();
  };

  const fetchPublic = async () => {
      const url = `${BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd`;
      const res = await fetch(url, getOptions());
      if (!res.ok) throw new Error(res.status.toString());
      return await res.json();
  };

  try {
      // 1. Try with API Key
      return await fetchWithKey();
  } catch (error) {
      console.warn("CoinGecko API Key failed, falling back to public endpoint...", error);
      try {
          // 2. Fallback to Public (No Key)
          return await fetchPublic();
      } catch (fallbackError) {
          console.error("CoinGecko Price Error:", fallbackError);
          return {};
      }
  }
};
