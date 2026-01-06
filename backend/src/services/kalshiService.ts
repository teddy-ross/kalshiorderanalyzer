import { KalshiClient } from '@kalshi/kalshi-js';
import { OrderFlow } from '../database/schema.js';

export class KalshiService {
  private client: KalshiClient;
  private isConnected: boolean = false;

  constructor(apiKey: string, privateKey: string, environment: string = 'prod') {
    this.client = new KalshiClient({
      apiKey,
      privateKey,
      environment: environment as 'demo' | 'prod',
    });
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting portfolio
      await this.client.getPortfolio();
      this.isConnected = true;
      console.log('Connected to Kalshi API');
    } catch (error) {
      console.error('Failed to connect to Kalshi API:', error);
      throw error;
    }
  }

  async getMarkets(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.getMarkets({ limit });
      return response.markets || [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async getMarket(ticker: string): Promise<any> {
    try {
      const response = await this.client.getMarket({ ticker });
      return response.market;
    } catch (error) {
      console.error(`Error fetching market ${ticker}:`, error);
      throw error;
    }
  }

  async getOrderBook(ticker: string): Promise<any> {
    try {
      const response = await this.client.getOrderBook({ ticker });
      return response;
    } catch (error) {
      console.error(`Error fetching order book for ${ticker}:`, error);
      throw error;
    }
  }

  async getTrades(ticker: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.client.getTrades({ ticker, limit });
      return response.trades || [];
    } catch (error) {
      console.error(`Error fetching trades for ${ticker}:`, error);
      throw error;
    }
  }

  // Convert Kalshi trade data to OrderFlow format
  convertTradeToOrderFlow(trade: any, marketTicker: string): OrderFlow {
    return {
      timestamp: new Date(trade.ts).getTime(),
      market_ticker: marketTicker,
      side: trade.side.toLowerCase() as 'yes' | 'no',
      action: 'fill',
      price: trade.price,
      size: trade.count,
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
          price: bid.price,
          size: bid.count,
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
          price: ask.price,
          size: ask.count,
          raw_data: JSON.stringify(ask),
        });
      });
    }

    return orderFlows;
  }

  getClient(): KalshiClient {
    return this.client;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
