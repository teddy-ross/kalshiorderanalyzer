import { ExchangeInstance, Configuration, MarketApi, PortfolioApi, ExchangeApi } from 'kalshi-typescript';
import { OrderFlow } from '../database/schema.js';

export class KalshiService {
  private exchange: ExchangeInstance;
  private marketApi: MarketApi;
  private portfolioApi: PortfolioApi;
  private exchangeApi: ExchangeApi;
  private isConnected: boolean = false;

  constructor(apiKey: string, privateKey: string, environment: string = 'prod') {
    const baseUrl = environment === 'demo' 
      ? 'https://demo-api.kalshi.com/trade-api/v2'
      : 'https://trading-api.kalshi.com/trade-api/v2';
    
    const config = new Configuration({
      apiKey: apiKey,
      privateKey: privateKey,
      basePath: baseUrl,
    });

    this.exchange = new ExchangeInstance(config);
    this.marketApi = new MarketApi(config);
    this.portfolioApi = new PortfolioApi(config);
    this.exchangeApi = new ExchangeApi(config);
  }

  async connect(): Promise<void> {
    try {
      // Test connection by getting portfolio
      await this.portfolioApi.getPortfolio();
      this.isConnected = true;
      console.log('Connected to Kalshi API');
    } catch (error) {
      console.error('Failed to connect to Kalshi API:', error);
      throw error;
    }
  }

  async getMarkets(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.marketApi.getMarkets({ limit });
      return response.markets || [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async getMarket(ticker: string): Promise<any> {
    try {
      const response = await this.marketApi.getMarket({ ticker });
      return response.market;
    } catch (error) {
      console.error(`Error fetching market ${ticker}:`, error);
      throw error;
    }
  }

  async getOrderBook(ticker: string): Promise<any> {
    try {
      const response = await this.marketApi.getOrderBook({ ticker });
      return response;
    } catch (error) {
      console.error(`Error fetching order book for ${ticker}:`, error);
      throw error;
    }
  }

  async getTrades(ticker: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.marketApi.getTrades({ ticker, limit });
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

  getClient(): ExchangeInstance {
    return this.exchange;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
