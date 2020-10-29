/**
 * API response of ticker
 * 
 * Example as follows: https://www.bitstamp.net/api/v2/ticker/btcusd/
 */
export interface bitstamp_ticker {
  high: string;
  last: string;
  timestamp: string;
  bid: string;
  vwap: string;
  volume: string;
  low: string;
  ask: string;
  open: string;
}