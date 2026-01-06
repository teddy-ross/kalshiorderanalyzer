import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface OrderFlow {
  id?: number;
  timestamp: number;
  market_ticker: string;
  side: 'yes' | 'no';
  action: 'bid' | 'ask' | 'fill';
  price: number;
  size: number;
  order_id?: string;
  raw_data?: string;
}

export interface Market {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
}

export const apiService = {
  // Order Flows
  getOrderFlows: async (limit: number = 100, market?: string): Promise<OrderFlow[]> => {
    const params: any = { limit };
    if (market) params.market = market;
    const response = await api.get('/order-flows', { params });
    return response.data.orderFlows;
  },

  getOrderFlowsByRange: async (
    startTime: number,
    endTime: number,
    market?: string
  ): Promise<OrderFlow[]> => {
    const params: any = { startTime, endTime };
    if (market) params.market = market;
    const response = await api.get('/order-flows/range', { params });
    return response.data.orderFlows;
  },

  // Markets
  getMarkets: async (limit: number = 50): Promise<Market[]> => {
    const response = await api.get('/markets', { params: { limit } });
    return response.data.markets;
  },

  getMarket: async (ticker: string): Promise<Market> => {
    const response = await api.get(`/markets/${ticker}`);
    return response.data.market;
  },

  getOrderBook: async (ticker: string): Promise<any> => {
    const response = await api.get(`/markets/${ticker}/orderbook`);
    return response.data.orderBook;
  },

  getTrades: async (ticker: string, limit: number = 100): Promise<any[]> => {
    const response = await api.get(`/markets/${ticker}/trades`, { params: { limit } });
    return response.data.trades;
  },

  getMarketStats: async (ticker: string, timeRangeMinutes: number = 60): Promise<any> => {
    const response = await api.get(`/markets/${ticker}/stats`, {
      params: { timeRange: timeRangeMinutes },
    });
    return response.data;
  },

  // Monitor
  getMonitoredMarkets: async (): Promise<string[]> => {
    const response = await api.get('/monitor/markets');
    return response.data.markets;
  },

  addMarketToMonitor: async (ticker: string): Promise<void> => {
    await api.post(`/monitor/markets/${ticker}`);
  },

  removeMarketFromMonitor: async (ticker: string): Promise<void> => {
    await api.delete(`/monitor/markets/${ticker}`);
  },
};
