import { Router, Request, Response } from 'express';
import { OrderFlowDatabase } from '../database/schema.js';
import { KalshiService } from '../services/kalshiService.js';
import { OrderFlowMonitor } from '../services/orderFlowMonitor.js';

export function createApiRouter(
  kalshiService: KalshiService,
  db: OrderFlowDatabase,
  monitor: OrderFlowMonitor
): Router {
  const router = Router();

  // Get recent order flows
  router.get('/order-flows', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const marketTicker = req.query.market as string | undefined;
      const orderFlows = db.getRecentOrderFlows(limit, marketTicker);
      res.json({ orderFlows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order flows' });
    }
  });

  // Get order flows by time range
  router.get('/order-flows/range', (req: Request, res: Response) => {
    try {
      const startTime = parseInt(req.query.startTime as string);
      const endTime = parseInt(req.query.endTime as string);
      const marketTicker = req.query.market as string | undefined;

      if (!startTime || !endTime) {
        return res.status(400).json({ error: 'startTime and endTime are required' });
      }

      const orderFlows = db.getOrderFlowsByTimeRange(startTime, endTime, marketTicker);
      res.json({ orderFlows });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order flows' });
    }
  });

  // Get market statistics
  router.get('/markets/:ticker/stats', (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      const timeRangeMinutes = parseInt(req.query.timeRange as string) || 60;
      const stats = db.getMarketStats(ticker, timeRangeMinutes);
      res.json({ ticker, stats, timeRangeMinutes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market stats' });
    }
  });

  // Get available markets
  router.get('/markets', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const markets = await kalshiService.getMarkets(limit);
      res.json({ markets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch markets' });
    }
  });

  // Get specific market
  router.get('/markets/:ticker', async (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      const market = await kalshiService.getMarket(ticker);
      res.json({ market });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch market' });
    }
  });

  // Get order book for a market
  router.get('/markets/:ticker/orderbook', async (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      const orderBook = await kalshiService.getOrderBook(ticker);
      res.json({ ticker, orderBook });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch order book' });
    }
  });

  // Get trades for a market
  router.get('/markets/:ticker/trades', async (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      const limit = parseInt(req.query.limit as string) || 100;
      const trades = await kalshiService.getTrades(ticker, limit);
      res.json({ ticker, trades });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trades' });
    }
  });

  // Get monitored markets
  router.get('/monitor/markets', (req: Request, res: Response) => {
    try {
      const markets = monitor.getMonitoredMarkets();
      res.json({ markets });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get monitored markets' });
    }
  });

  // Add market to monitor
  router.post('/monitor/markets/:ticker', (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      monitor.addMarket(ticker);
      res.json({ message: `Added ${ticker} to monitoring`, markets: monitor.getMonitoredMarkets() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add market to monitor' });
    }
  });

  // Remove market from monitor
  router.delete('/monitor/markets/:ticker', (req: Request, res: Response) => {
    try {
      const ticker = req.params.ticker;
      monitor.removeMarket(ticker);
      res.json({ message: `Removed ${ticker} from monitoring`, markets: monitor.getMonitoredMarkets() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove market from monitor' });
    }
  });

  return router;
}
