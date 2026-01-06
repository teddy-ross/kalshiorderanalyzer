import { KalshiService } from './kalshiService.js';
import { OrderFlowDatabase, OrderFlow } from '../database/schema.js';
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export class OrderFlowMonitor extends EventEmitter {
  private kalshiService: KalshiService;
  private db: OrderFlowDatabase;
  private ws: WebSocket | null = null;
  private monitoredMarkets: Set<string> = new Set();
  private reconnectInterval: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(kalshiService: KalshiService, db: OrderFlowDatabase) {
    super();
    this.kalshiService = kalshiService;
    this.db = db;
  }

  async startMonitoring(marketTickers: string[] = []) {
    console.log('🚀 Starting order flow monitoring...');

    // Add markets to monitor
    marketTickers.forEach(ticker => this.monitoredMarkets.add(ticker));

    // If no markets specified, get active markets
    if (this.monitoredMarkets.size === 0) {
      try {
        const markets = await this.kalshiService.getMarkets(20);
        markets.forEach(market => {
          if (market.ticker) {
            this.monitoredMarkets.add(market.ticker);
          }
        });
        console.log(`📊 Monitoring ${this.monitoredMarkets.size} markets`);
      } catch (error) {
        console.error('Error fetching markets:', error);
      }
    }

    // Start polling for trades
    this.startPolling();

    // Try to establish WebSocket connection if available
    // Note: Kalshi WebSocket API may require specific setup
    // For now, we'll use polling
  }

  private startPolling() {
    // Poll every 5 seconds for new trades
    this.pollInterval = setInterval(async () => {
      for (const ticker of this.monitoredMarkets) {
        try {
          await this.pollMarketTrades(ticker);
          await this.pollOrderBook(ticker);
        } catch (error) {
          console.error(`Error polling ${ticker}:`, error);
        }
      }
    }, 5000);
  }

  private async pollMarketTrades(ticker: string) {
    try {
      const trades = await this.kalshiService.getTrades(ticker, 10);
      
      for (const trade of trades) {
        const orderFlow = this.kalshiService.convertTradeToOrderFlow(trade, ticker);
        
        // Check if we already have this trade
        const existing = this.db.getRecentOrderFlows(1000, ticker);
        const isDuplicate = existing.some(
          of => of.order_id === orderFlow.order_id && of.action === 'fill'
        );

        if (!isDuplicate) {
          this.db.insertOrderFlow(orderFlow);
          this.emit('orderFlow', orderFlow);
          console.log(`📈 New trade: ${ticker} ${orderFlow.side} @ ${orderFlow.price} x ${orderFlow.size}`);
        }
      }
    } catch (error) {
      console.error(`Error polling trades for ${ticker}:`, error);
    }
  }

  private async pollOrderBook(ticker: string) {
    try {
      const orderBook = await this.kalshiService.getOrderBook(ticker);
      
      if (orderBook && orderBook.yes) {
        // Process YES side
        const yesBids = orderBook.yes.bids || [];
        const yesAsks = orderBook.yes.asks || [];
        
        yesBids.forEach((bid: any) => {
          const orderFlow: OrderFlow = {
            timestamp: Date.now(),
            market_ticker: ticker,
            side: 'yes',
            action: 'bid',
            price: bid.price,
            size: bid.count,
            raw_data: JSON.stringify(bid),
          };
          this.emit('orderFlow', orderFlow);
        });

        yesAsks.forEach((ask: any) => {
          const orderFlow: OrderFlow = {
            timestamp: Date.now(),
            market_ticker: ticker,
            side: 'yes',
            action: 'ask',
            price: ask.price,
            size: ask.count,
            raw_data: JSON.stringify(ask),
          };
          this.emit('orderFlow', orderFlow);
        });
      }

      if (orderBook && orderBook.no) {
        // Process NO side
        const noBids = orderBook.no.bids || [];
        const noAsks = orderBook.no.asks || [];
        
        noBids.forEach((bid: any) => {
          const orderFlow: OrderFlow = {
            timestamp: Date.now(),
            market_ticker: ticker,
            side: 'no',
            action: 'bid',
            price: bid.price,
            size: bid.count,
            raw_data: JSON.stringify(bid),
          };
          this.emit('orderFlow', orderFlow);
        });

        noAsks.forEach((ask: any) => {
          const orderFlow: OrderFlow = {
            timestamp: Date.now(),
            market_ticker: ticker,
            side: 'no',
            action: 'ask',
            price: ask.price,
            size: ask.count,
            raw_data: JSON.stringify(ask),
          };
          this.emit('orderFlow', orderFlow);
        });
      }
    } catch (error) {
      console.error(`Error polling order book for ${ticker}:`, error);
    }
  }

  addMarket(ticker: string) {
    this.monitoredMarkets.add(ticker);
    console.log(`➕ Added market to monitor: ${ticker}`);
  }

  removeMarket(ticker: string) {
    this.monitoredMarkets.delete(ticker);
    console.log(`➖ Removed market from monitor: ${ticker}`);
  }

  getMonitoredMarkets(): string[] {
    return Array.from(this.monitoredMarkets);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log('🛑 Order flow monitoring stopped');
  }
}
