/// Fyers Options Platform — Core Type Definitions
///
/// Every type used across backend engines, API routes, and frontend.
/// SINGLE SOURCE OF TRUTH — no duplicate interfaces.

// ═══════════════════════════════════════════════════════════
// INDICES
// ═══════════════════════════════════════════════════════════

export type IndexSymbol = 'NIFTY' | 'BANKNIFTY' | 'SENSEX';

export const INDEX_CONFIG: Record<
  IndexSymbol,
  { fyersSymbol: string; lotSize: number; tickSize: number; label: string }
> = {
  NIFTY: {
    fyersSymbol: 'NSE:NIFTY50-INDEX',
    lotSize: 25,
    tickSize: 50,
    label: 'NIFTY 50',
  },
  BANKNIFTY: {
    fyersSymbol: 'NSE:NIFTYBANK-INDEX',
    lotSize: 15,
    tickSize: 100,
    label: 'BANK NIFTY',
  },
  SENSEX: {
    fyersSymbol: 'BSE:SENSEX-INDEX',
    lotSize: 10,
    tickSize: 100,
    label: 'SENSEX',
  },
};

// ═══════════════════════════════════════════════════════════
// STRIKE RANGE FILTER
// ═══════════════════════════════════════════════════════════

export type StrikeRange = 5 | 10;

// ═══════════════════════════════════════════════════════════
// OPTION CHAIN
// ═══════════════════════════════════════════════════════════

export interface OptionStrike {
  strikePrice: number;
  callOI: number;
  putOI: number;
  callOIChange: number;
  putOIChange: number;
  callVolume: number;
  putVolume: number;
  callLTP: number;
  putLTP: number;
  callIV: number;
  putIV: number;
}

// ═══════════════════════════════════════════════════════════
// MARKET SNAPSHOT (ATOMIC — never partially constructed)
// ═══════════════════════════════════════════════════════════

export interface MarketSnapshot {
  timestamp: string;
  spotPrice: number;
  optionChain: OptionStrike[];
  expiryDate: string;
  index: IndexSymbol;
}

// ═══════════════════════════════════════════════════════════
// SUPPORT / RESISTANCE
// ═══════════════════════════════════════════════════════════

export interface SRResult {
  support: number;
  resistance: number;
  supportStrength: number; // 0–1
  resistanceStrength: number; // 0–1
  supportConfidence: number; // 0–1 (volatility-adjusted)
  resistanceConfidence: number; // 0–1 (volatility-adjusted)
}

// ═══════════════════════════════════════════════════════════
// VOLATILITY
// ═══════════════════════════════════════════════════════════

export type VolatilityRegime = 'HIGH_MOMENTUM' | 'COMPRESSION' | 'NORMAL';

export interface VolatilityResult {
  volatilityPerSec: number;
  volatilityMA: number;
  volatilityRatio: number;
  regime: VolatilityRegime;
  history: number[]; // last 10 samples
}

// ═══════════════════════════════════════════════════════════
// MARKET PRESSURE
// ═══════════════════════════════════════════════════════════

export interface MarketPressureResult {
  weightedPut: number;
  weightedCall: number;
  pressure: number; // −1 to +1 (positive = bullish put support)
  pressureLabel: string; // "Bullish" | "Bearish" | "Neutral"
}

// ═══════════════════════════════════════════════════════════
// BUYER / SELLER ACTIVITY
// ═══════════════════════════════════════════════════════════

export type DominantActivity =
  | 'CALL_BUYER'
  | 'CALL_SELLER'
  | 'PUT_BUYER'
  | 'PUT_SELLER'
  | 'NONE';

export interface BuyerSellerSignal {
  callBuyer: number;
  callSeller: number;
  putBuyer: number;
  putSeller: number;
  dominant: DominantActivity;
  dominancePercent: number;
}

// ═══════════════════════════════════════════════════════════
// STRIKE-SPECIFIC ANALYSIS
// ═══════════════════════════════════════════════════════════

export interface StrikeAnalysis {
  strike: number;
  localSupport: number;
  localResistance: number;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════
// COMPOSITE API RESPONSE (Backend → Frontend)
// ═══════════════════════════════════════════════════════════

export interface AnalysisResponse {
  timestamp: string;
  spot: number;
  index: IndexSymbol;
  expiryDate: string;

  // S/R
  support: number;
  resistance: number;
  supportConfidence: number;
  resistanceConfidence: number;
  supportStrength: number;
  resistanceStrength: number;

  // Volatility
  volatilityPerSec: number;
  volatilityMA: number;
  regime: VolatilityRegime;

  // Pressure
  marketPressure: number;
  pressureLabel: string;

  // Buyer/Seller
  buyerSellerSignals: BuyerSellerSignal;

  // Strike-specific (null if none selected)
  strikeSpecificData: StrikeAnalysis | null;

  // Raw chain (for table display)
  optionChain: OptionStrike[];

  // Meta
  refreshCount: number;
  priceChange: number;
}

// ═══════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════

export interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // Unix ms
  appId: string;
}

export interface AuthStatus {
  authenticated: boolean;
  expiresAt: number | null;
}

// ═══════════════════════════════════════════════════════════
// REFRESH INTERVALS
// ═══════════════════════════════════════════════════════════

export const REFRESH_INTERVALS = [5, 10, 15] as const;
export type RefreshInterval = (typeof REFRESH_INTERVALS)[number];
