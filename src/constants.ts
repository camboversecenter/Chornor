
import { Category, CryptoAsset, CryptoTransaction, Transaction, Family, Lending, Saving, CommunityPost, PostType, ReactionType } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { _id: 'cat_1', name: 'ប្រាក់ខែ (Salary)', chomnay: false, color: '#10B981', order: 1 },
  { _id: 'cat_2', name: 'ម្ហូបអាហារ (Food)', chomnay: true, color: '#F59E0B', order: 2 },
  { _id: 'cat_3', name: 'ការធ្វើដំណើរ (Transport)', chomnay: true, color: '#3B82F6', order: 3 },
  { _id: 'cat_4', name: 'សេវាកម្ម (Utilities)', chomnay: true, color: '#6366F1', order: 4 },
  { _id: 'cat_5', name: 'កម្សាន្ត (Entertainment)', chomnay: true, color: '#EC4899', order: 5 },
  { _id: 'cat_6', name: 'ផ្សេងៗ (Others)', chomnay: true, color: '#9CA3AF', order: 99 },
];

export const CURRENCY_USD = '$';
export const CURRENCY_KHR = '៛';
export const EXCHANGE_RATE = 4100; // 1 USD = 4100 KHR

export const INITIAL_FAMILY: Family[] = [
  { _id: 'fam_1', name: 'Me' },
  { _id: 'fam_2', name: 'Wife' },
  { _id: 'fam_3', name: 'Mom' },
  { _id: 'fam_4', name: 'Dad' }
];

const generateMockTransactions = (): Transaction[] => {
  const txs: Transaction[] = [];
  const now = new Date();
  
  // Weights for categories to make it realistic
  // cat_1 (Salary): Income
  // cat_2 (Food): Expense, frequent
  // cat_3 (Transport): Expense, frequent
  
  for(let i=0; i<100; i++) {
     const dayOffset = Math.floor(Math.random() * 60); // Last 60 days
     const date = new Date(now);
     date.setDate(date.getDate() - dayOffset);
     const dateStr = date.toISOString().split('T')[0];
     
     // Mock createdAt being slightly after the actual date (or same day)
     const createdAt = new Date(date);
     createdAt.setHours(Math.floor(Math.random() * 23), Math.floor(Math.random() * 59));
     const createdAtStr = createdAt.toISOString();

     const rand = Math.random();
     let catId = '';
     let desc = '';
     let amount = 0;
     let currency: 'USD' | 'KHR' = 'USD';
     // Randomly assign a family member or keep undefined
     let familyId = Math.random() > 0.2 ? INITIAL_FAMILY[Math.floor(Math.random() * INITIAL_FAMILY.length)]._id : undefined;

     if (rand < 0.05) {
         // Salary (Income) - Rare
         catId = 'cat_1';
         desc = 'Monthly Salary';
         amount = 1500 + Math.floor(Math.random() * 500);
     } else if (rand < 0.45) {
         // Food - Frequent
         catId = 'cat_2';
         const foods = ['Breakfast', 'Lunch', 'Dinner', 'Coffee', 'Snacks', 'Groceries', 'Pizza', 'Pho'];
         desc = foods[Math.floor(Math.random() * foods.length)];
         if (Math.random() > 0.5) {
             currency = 'KHR';
             amount = (Math.floor(Math.random() * 40) + 5) * 1000; // 5000 - 45000 KHR
         } else {
             amount = parseFloat((Math.random() * 15 + 2).toFixed(2)); // 2 - 17 USD
         }
     } else if (rand < 0.65) {
         // Transport
         catId = 'cat_3';
         desc = Math.random() > 0.5 ? 'Gasoline' : 'TukTuk / Taxi';
         amount = parseFloat((Math.random() * 10 + 1).toFixed(2));
     } else if (rand < 0.8) {
         // Utilities
         catId = 'cat_4';
         desc = Math.random() > 0.5 ? 'Electricity Bill' : 'Phone Topup';
         amount = parseFloat((Math.random() * 50 + 2).toFixed(2));
     } else if (rand < 0.9) {
         // Entertainment
         catId = 'cat_5';
         desc = 'Cinema & Popcorn';
         amount = parseFloat((Math.random() * 20 + 5).toFixed(2));
     } else {
         // Others
         catId = 'cat_6';
         desc = 'General Shopping';
         amount = parseFloat((Math.random() * 50 + 5).toFixed(2));
     }

     txs.push({
         _id: `mock_tx_${i}`,
         categoryId: catId,
         familyId,
         amount,
         currency,
         date: dateStr,
         createdAt: createdAtStr,
         description: desc,
         reminder: 'NONE'
     });
  }
  return txs;
};

export const INITIAL_TRANSACTIONS = generateMockTransactions();

export const INITIAL_LENDINGS: Lending[] = [
    {
        _id: 'mock_loan_1',
        title: 'Personal Loan (Car)',
        lender: 'Acleda Bank',
        borrower: 'Me',
        amountRiel: 0,
        amountDollar: 25000,
        interestRate: 0.75,
        paymentMonths: 60,
        downRiel: 0,
        downDollar: 5000,
        paymentMethod: 'ប្រចាំខែ',
        isComplete: false,
        createdAt: new Date().toISOString()
    }
];

export const INITIAL_SAVINGS: Saving[] = [
    {
        _id: 'mock_save_1',
        title: 'Emergency Fund',
        familyId: 'fam_1',
        targetDollar: 10000,
        targetRiel: 0,
        savedDollar: 2500,
        savedRiel: 0,
        createdAt: new Date().toISOString()
    },
    {
        _id: 'mock_save_2',
        title: 'New Moto',
        familyId: 'fam_3',
        targetDollar: 2000,
        targetRiel: 0,
        savedDollar: 500,
        savedRiel: 400000,
        createdAt: new Date().toISOString()
    }
];

export const INITIAL_CRYPTO_ASSETS: CryptoAsset[] = [
    {
        _id: 'asset_btc',
        symbol: 'BTC',
        name: 'Bitcoin',
        coingeckoId: 'bitcoin',
        image: 'https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png',
        quantity: 0.15,
        averageBuyPrice: 42000,
        currentPrice: 65000, // Mock current price
        createdAt: new Date().toISOString()
    },
    {
        _id: 'asset_eth',
        symbol: 'ETH',
        name: 'Ethereum',
        coingeckoId: 'ethereum',
        image: 'https://coin-images.coingecko.com/coins/images/279/thumb/ethereum.png',
        quantity: 2.5,
        averageBuyPrice: 2800,
        currentPrice: 3500, // Mock current price
        createdAt: new Date().toISOString()
    },
    {
        _id: 'asset_sol',
        symbol: 'SOL',
        name: 'Solana',
        coingeckoId: 'solana',
        image: 'https://coin-images.coingecko.com/coins/images/4128/thumb/solana.png',
        quantity: 50,
        averageBuyPrice: 85,
        currentPrice: 145, // Mock current price
        createdAt: new Date().toISOString()
    }
];

export const INITIAL_CRYPTO_TRANSACTIONS: CryptoTransaction[] = [
    {
        _id: 'tx_btc_1',
        assetId: 'asset_btc',
        type: 'BUY',
        quantity: 0.15,
        price: 42000,
        date: new Date(Date.now() - 86400000 * 30).toISOString() // 30 days ago
    },
    {
         _id: 'tx_eth_1',
         assetId: 'asset_eth',
         type: 'BUY',
         quantity: 2.5,
         price: 2800,
         date: new Date(Date.now() - 86400000 * 15).toISOString() // 15 days ago
    },
     {
         _id: 'tx_sol_1',
         assetId: 'asset_sol',
         type: 'BUY',
         quantity: 50,
         price: 85,
         date: new Date(Date.now() - 86400000 * 7).toISOString() // 7 days ago
    }
];

// --- MOCK COMMUNITY POSTS GENERATOR ---
const generateMockPosts = (): CommunityPost[] => {
  const posts: CommunityPost[] = [];
  const authors = ['Sophea', 'Vireak', 'Dara', 'Bopha', 'SreyNeang', 'Visal', 'Rithy', 'Leakena', 'CryptoKhmer', 'MoneyMaster', 'SaverPro', 'Chan', 'Tola', 'Nary'];
  
  const expenseContents = [
      'Lucky Supermarket has 50% off on vegetables every evening after 7 PM.',
      'Aeon Mall Sen Sok having clearance sale on clothes, up to 70% off!',
      'Found a great way to save on electricity: switch to LED bulbs and unplug devices.',
      'Buy meats in bulk at Orussey Market, much cheaper than supermarkets.',
      'Use PassApp coupons if you travel often, saves me $10 a month.',
      'Make coffee at home instead of Starbucks, saved $50 this month!',
      'Smart mobile data plans are cheaper if you subscribe weekly instead of daily.',
      'Avoid eating out for lunch, bring home cooked food. Healthier and cheaper.',
      'Local market vs Supermarket: Local is 30% cheaper for fruits.',
      'Always ask for discount when buying electronics at small shops.'
  ];

  const revenueContents = [
      'I learned basic graphic design on Canva and now make $50/week designing posters.',
      'Grab driver part-time on weekends can earn you extra $30-50.',
      'Teaching English online is a good side hustle for students.',
      'Selling second-hand clothes on Facebook Live is very popular now.',
      'Start a small food stall in front of your house for breakfast.',
      'Freelance translation (Khmer-English) pays well per page.',
      'Make YouTube videos about your hobby, monetization takes time but worth it.',
      'Babysitting for neighbors on weekends.',
      'Affiliate marketing for beauty products on TikTok.',
      'Learn coding (React/Node) - high demand for remote work.'
  ];

  const digitalContents = [
      'Bitcoin just broke $65k! Indicators showing strong momentum.',
      'Ethereum gas fees are low today, good time to move assets.',
      'Solana ecosystem is growing fast, check out the new DEX.',
      'Be careful of phishing links in Telegram crypto groups!',
      'NFT market is cooling down, better to invest in utility tokens.',
      'What do you think about the new Layer 2 scaling solutions?',
      'DCA (Dollar Cost Average) is the safest strategy for beginners.',
      'GameFi project "Axie" is updating their mechanics.',
      'RWA (Real World Assets) tokenization is the next big narrative.',
      'Don\'t invest money you can\'t afford to lose in meme coins.'
  ];

  const generateReactions = (type: PostType) => {
      const reactions: Record<string, number> = {};
      if (type === 'DIGITAL_ASSET') {
          reactions['BULLISH'] = Math.floor(Math.random() * 50);
          reactions['BEARISH'] = Math.floor(Math.random() * 10);
          reactions['SCAM'] = Math.floor(Math.random() * 2);
          reactions['FAKE'] = Math.floor(Math.random() * 2);
      } else {
          reactions['LIKE'] = Math.floor(Math.random() * 50);
          reactions['DISLIKE'] = Math.floor(Math.random() * 5);
          reactions['FAKE'] = Math.floor(Math.random() * 2);
      }
      return reactions;
  };

  // Generate 100 posts
  for (let i = 0; i < 100; i++) {
      const rand = Math.random();
      let type: PostType;
      let contentTemplate = [];
      
      if (rand < 0.33) {
          type = 'REDUCE_EXPENSE';
          contentTemplate = expenseContents;
      } else if (rand < 0.66) {
          type = 'INCREASE_REVENUE';
          contentTemplate = revenueContents;
      } else {
          type = 'DIGITAL_ASSET';
          contentTemplate = digitalContents;
      }

      const content = contentTemplate[Math.floor(Math.random() * contentTemplate.length)] + ` (Variation ${i})`;
      const author = authors[Math.floor(Math.random() * authors.length)];
      
      const timeOffset = Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days
      const createdAt = new Date(Date.now() - timeOffset).toISOString();

      posts.push({
          _id: `mock_post_${i}`,
          type,
          content,
          author,
          createdAt,
          reactions: generateReactions(type),
          userReaction: null
      });
  }
  
  // Sort by date new to old
  return posts.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const INITIAL_POSTS: CommunityPost[] = generateMockPosts();
