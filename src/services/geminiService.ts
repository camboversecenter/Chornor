
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Category, Lending, Saving, CryptoAsset, TransactionItem, AppNotification, PostType, CommunityPost } from "../types";
import * as storage from "./storageService";

const getGeminiApiKey = () =>
  import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || '';

const getAI = () => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Gemini API key is missing. Add VITE_GEMINI_API_KEY or GEMINI_API_KEY to .env and restart the dev server.');
  }

  return new GoogleGenAI({ apiKey });
};

// Helper to convert File to Base64 for Gemini
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[],
  lendings: Lending[],
  savings: Saving[],
  crypto: CryptoAsset[],
  notifications: AppNotification[]
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';

    // 1. Transaction Summary (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTx = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    // Normalize everything to USD for the AI context to simplify math
    const income = recentTx.filter(t => {
        const cat = categories.find(c => c._id === t.categoryId);
        return cat && !cat.chomnay;
    }).reduce((acc, t) => acc + (t.currency === 'USD' ? t.amount : t.amount / 4100), 0);
    
    const expense = recentTx.filter(t => {
        const cat = categories.find(c => c._id === t.categoryId);
        return cat && cat.chomnay;
    }).reduce((acc, t) => acc + (t.currency === 'USD' ? t.amount : t.amount / 4100), 0);

    // Top spending categories
    const catTotals: Record<string, number> = {};
    recentTx.forEach(t => {
        const cat = categories.find(c => c._id === t.categoryId);
        if (cat && cat.chomnay) {
            const amountUSD = t.currency === 'USD' ? t.amount : t.amount / 4100;
            catTotals[cat.name] = (catTotals[cat.name] || 0) + amountUSD;
        }
    });
    
    const topCategories = Object.entries(catTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name, val]) => `${name} ($${val.toFixed(2)})`)
        .join(', ');

    // 2. Savings
    const totalSavedUSD = savings.reduce((acc, s) => acc + s.savedDollar + (s.savedRiel/4100), 0);
    const totalTargetUSD = savings.reduce((acc, s) => acc + s.targetDollar + (s.targetRiel/4100), 0);

    // 3. Lending/Debt
    // Assuming 'Lending' entries where I am the borrower counts as debt, or just total active loan volume
    // For simplicity, we'll list total active loan volume
    const totalLoanVolumeUSD = lendings.reduce((acc, l) => acc + l.amountDollar + (l.amountRiel/4100), 0);
    
    // 4. Crypto
    const cryptoValueUSD = crypto.reduce((acc, c) => acc + (c.quantity * c.currentPrice), 0);
    const cryptoProfitUSD = crypto.reduce((acc, c) => acc + (c.quantity * (c.currentPrice - c.averageBuyPrice)), 0);

    // 5. Notifications / Alerts
    const alertsList = notifications.length > 0 
        ? notifications.map(n => `- ${n.title}: ${n.message} (${n.isOverdue ? 'Overdue!' : 'Upcoming'})`).join('\n')
        : "No active alerts.";

    const prompt = `
      You are a smart financial advisor for the Khmer app "Chornor".
      Analyze this user's financial status based on the data below.
      
      **Data Summary (All converted to approx USD):**
      - **Last 30 Days Cash Flow**:
        - Income: $${income.toFixed(2)}
        - Expense: $${expense.toFixed(2)}
        - Net Flow: $${(income-expense).toFixed(2)}
        - Top Expenses: ${topCategories}
      
      - **Savings**: Saved $${totalSavedUSD.toFixed(2)} (Goal: $${totalTargetUSD.toFixed(2)})
      - **Loans/Debt Tracking**: Total Volume $${totalLoanVolumeUSD.toFixed(2)}
      - **Crypto Portfolio**: Current Value $${cryptoValueUSD.toFixed(2)}, P/L: $${cryptoProfitUSD.toFixed(2)}

      - **Alerts & Recurring Tasks (IMPORTANT)**:
      ${alertsList}

      **Instruction:**
      Provide a helpful, encouraging financial analysis in **Khmer**.
      Use a friendly and professional tone. Use emojis.
      
      Structure your response as follows:
      1. **ការចំណាយ (Spending)**: Brief comment on income vs expense and top categories.
      2. **ស្ថានភាពហិរញ្ញវត្ថុ (Health)**: Comment on savings progress, debt, or investments (crypto).
      3. **ការដាស់តឿន (Alerts)**: List down any urgent alerts or recurring tasks found in the data above. If none, say "None".
      4. **អនុសាសន៍ (Recommendation)**: Give 1 specific, actionable tip to improve.
      
      Keep it concise (under 200 words total).
    `;

    const response = await getAI().models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "មិនអាចវិភាគទិន្នន័យបានទេនៅពេលនេះ។";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ AI។ សូមព្យាយាមម្តងទៀត។";
  }
};

export const suggestCategory = async (
  description: string,
  categories: Category[]
): Promise<string | null> => {
    try {
        const categoryNames = categories.map(c => c.name).join(', ');
        const prompt = `
          Given the transaction description: "${description}", match it to exactly one of these categories: [${categoryNames}].
          Return ONLY the exact name of the category. If no match fits well, return "null".
        `;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const suggestedName = response.text?.trim();
        if (suggestedName && suggestedName !== 'null') {
            const match = categories.find(c => c.name === suggestedName);
            return match ? match._id : null;
        }
        return null;

    } catch (e) {
        return null;
    }
}

export interface ReceiptData {
  amount?: number;
  currency?: 'USD' | 'KHR';
  date?: string;
  description?: string;
  items?: TransactionItem[];
  categoryId?: string;
}

export const parseReceipt = async (imageFile: File, categories: Category[]): Promise<ReceiptData | null> => {
    try {
        const base64Data = await fileToBase64(imageFile);
        const mimeType = imageFile.type;
        
        const catList = categories.map(c => `ID: "${c._id}", Name: "${c.name}"`).join('\n');

        const prompt = `
           Analyze this receipt, bill, or invoice image. Extract the transaction details into a pure JSON object.
           
           Required JSON Structure:
           {
             "amount": number, // Total amount
             "currency": "USD" or "KHR", // Detect currency symbol. Default to USD if unsure.
             "date": "YYYY-MM-DD", // Date of transaction. Use today's date if not found.
             "description": string, // Merchant name or brief title.
             "items": [ // Extract line items if visible
                { "name": string, "quantity": number, "price": number } // Price is unit price
             ],
             "categoryId": string // Best matching ID from the provided list below.
           }

           Category List for matching:
           ${catList}
           
           If no category matches well, ignore categoryId or null.
           Only return the JSON object, no markdown formatting.
        `;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text || '';
        // Clean markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const data = JSON.parse(jsonStr);
        
        // Post-process items to ensure they match our internal structure types
        if (data.items && Array.isArray(data.items)) {
            data.items = data.items.map((item: any) => ({
                id: Date.now().toString() + Math.random(),
                name: item.name || 'Item',
                quantity: Number(item.quantity) || 1,
                price: Number(item.price) || 0
            }));
        }

        return data;

    } catch (error) {
        console.error("Receipt Scanning Error:", error);
        return null;
    }
};

export const extractWalletAddress = async (imageFile: File): Promise<string | null> => {
    try {
        const base64Data = await fileToBase64(imageFile);
        const mimeType = imageFile.type;

        const prompt = `
            Analyze this image (which may be a QR code or text).
            Extract the cryptocurrency wallet address. 
            Common formats include 0x... (EVM).
            
            Return ONLY the address string. If multiple, return the first one.
            If no address found, return "null".
        `;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text?.trim() || 'null';
        if (text === 'null') return null;
        
        // Basic cleanup if AI returns extra text
        const match = text.match(/0x[a-fA-F0-9]{40}/i);
        return match ? match[0] : text;

    } catch (error) {
        console.error("Address Scanning Error:", error);
        return null;
    }
};

export interface PostValidationResult {
  allowed: boolean;
  reason: string;
}

export const validateCommunityPost = async (content: string, type: PostType): Promise<PostValidationResult> => {
    try {
        const prompt = `
            You are a moderator for a community finance app "Chornor".
            Validate if the following post content is appropriate for the category: "${type}".
            
            Category Definitions:
            - REDUCE_EXPENSE: Sharing discount info, financial literacy, tips to save money.
            - INCREASE_REVENUE: Sharing jobs, part-time work, side hustles, or skills to earn money.
            - DIGITAL_ASSET: Sharing news, insights, or educational info about Crypto, NFT, GameFi, RWA, Web3, or Blockchain.

            Post Content: "${content}"

            Rules:
            1. Content must be strictly relevant to the category definition.
            2. Content must be under 120 words.
            3. No spam, scams, offensive language, or irrelevant promotion.
            4. Content must be helpful to the community.

            Return JSON:
            {
                "allowed": boolean,
                "reason": string // Brief reason why it is allowed or rejected in Khmer.
            }
        `;

        const response = await getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        allowed: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');
        return {
            allowed: json.allowed,
            reason: json.reason || 'Unknown reason'
        };

    } catch (error) {
        console.error("Post Validation Error:", error);
        return { allowed: false, reason: 'AI Validation Service Unavailable.' };
    }
};

// --- DAILY AI CONTENT GENERATOR ---

export const generateAndSaveDailyPosts = async (): Promise<void> => {
    const categories: PostType[] = ['REDUCE_EXPENSE', 'INCREASE_REVENUE', 'DIGITAL_ASSET'];
    const model = 'gemini-2.5-flash';

    for (const type of categories) {
        // 1. Check if posted today
        if (storage.hasAIPostedToday(type)) {
            continue;
        }

        try {
            // 2. Generate Content
            const prompt = `
                Generate a short, educational, and helpful financial literacy post in **Khmer language** for the category: "${type}".

                Context definitions:
                - REDUCE_EXPENSE: Practical tips on budgeting, saving money on daily items, or smart spending habits.
                - INCREASE_REVENUE: Ideas for side hustles, learning high-income skills, or career growth tips appropriate for Cambodians.
                - DIGITAL_ASSET: Educational fact or concept explanation about Blockchain, Crypto, or Web3 (Strictly educational, NO financial advice to buy specific tokens).

                Rules:
                - Language: Khmer (Cambodian).
                - Length: Under 60 words.
                - Tone: Friendly, encouraging, and professional (like a financial mentor).
                - Include 1-2 relevant emojis.
                - Do NOT start with "Here is a tip". Just state the tip directly.
            `;

            const response = await getAI().models.generateContent({
                model,
                contents: prompt
            });

            const content = response.text;

            if (content) {
                // 3. Save Post
                const newPost: CommunityPost = {
                    _id: `ai_${Date.now()}_${type}`,
                    type: type,
                    content: content.trim(),
                    author: 'CHORNOR AI 🤖',
                    createdAt: new Date().toISOString(),
                    reactions: {},
                    userReaction: null
                };

                storage.addCommunityPost(newPost);
                
                // 4. Mark as posted
                storage.markAIPostedToday(type);
                console.log(`Generated daily post for ${type}`);
            }

        } catch (error) {
            console.error(`Failed to generate daily post for ${type}`, error);
        }
    }
};
