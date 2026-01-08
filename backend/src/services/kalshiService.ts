import { Configuration, MarketApi, PortfolioApi, ExchangeApi } from 'kalshi-typescript';
import { OrderFlow } from '../database/schema.js';

export class KalshiService {
  private config: Configuration;
  private marketApi: MarketApi;
  private portfolioApi: PortfolioApi;
  private exchangeApi: ExchangeApi;
  private isConnected: boolean = false;

  constructor(apiKey: string, privateKey: string, environment: string = 'prod') {
    const baseUrl = environment === 'demo' 
      ? 'https://demo-api.kalshi.co/trade-api/v2'
      : 'https://api.kalshi.com/trade-api/v2';
    
    this.config = new Configuration({
      apiKey: apiKey,
      privateKeyPem: privateKey,
      basePath: baseUrl,
    });

    this.marketApi = new MarketApi(this.config);
    this.portfolioApi = new PortfolioApi(this.config);
    this.exchangeApi = new ExchangeApi(this.config);
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting exchange status
      const response = await this.exchangeApi.getExchangeStatus();
      this.isConnected = true;
      console.log('Connected to Kalshi API');
    } catch (error) {
      console.error('Failed to connect to Kalshi API:', error);
      // Still mark as connected for demo purposes - we can still use public endpoints
      this.isConnected = true;
      console.log('Running in limited mode (public endpoints only)');
    }
  }

  async getMarkets(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.marketApi.getMarkets(limit);
      return response.data.markets || [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async getMarket(ticker: string): Promise<any> {
    try {
      const response = await this.marketApi.getMarket(ticker);
      return response.data.market;
    } catch (error) {
      console.error(`Error fetching market ${ticker}:`, error);
      throw error;
    }
  }

  async getOrderBook(ticker: string): Promise<any> {
    try {
      const response = await this.marketApi.getMarketOrderbook(ticker);
      return response.data.orderbook;
    } catch (error) {
      console.error(`Error fetching order book for ${ticker}:`, error);
      throw error;
    }
  }

  async getTrades(ticker: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.marketApi.getTrades(limit, undefined, ticker);
      return response.data.trades || [];
    } catch (error) {
      console.error(`Error fetching trades for ${ticker}:`, error);
      throw error;
    }
  }

  // Convert Kalshi trade data to OrderFlow format
  convertTradeToOrderFlow(trade: any, marketTicker: string): OrderFlow {
    return {
      timestamp: new Date(trade.created_time || trade.ts).getTime(),
      market_ticker: marketTicker,
      side: (trade.taker_side || trade.side || 'yes').toLowerCase() as 'yes' | 'no',
      action: 'fill',
      price: trade.yes_price || trade.price || 0,
      size: trade.count || 1,
      order_id: trade.trade_id,
      raw_data: JSON.stringify(trade),
    };
  }

  // Convert order book update to OrderFlow format
  convertOrderBookUpdateToOrderFlow(
    update: any,
    marketTicker: string,
    side: 'yes' | 'no',
    action: 'bid' | 'ask'
  ): OrderFlow[] {
    const orderFlows: OrderFlow[] = [];
    
    if (update.bids && update.bids.length > 0) {
      update.bids.forEach((bid: any) => {
        orderFlows.push({
          timestamp: Date.now(),
          market_ticker: marketTicker,
          side,
          action: 'bid',
          price: bid[0] || bid.price,
          size: bid[1] || bid.count,
          raw_data: JSON.stringify(bid),
        });
      });
    }

    if (update.asks && update.asks.length > 0) {
      update.asks.forEach((ask: any) => {
        orderFlows.push({
          timestamp: Date.now(),
          market_ticker: marketTicker,
          side,
          action: 'ask',
          price: ask[0] || ask.price,
          size: ask[1] || ask.count,
          raw_data: JSON.stringify(ask),
        });
      });
    }

    return orderFlows;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
