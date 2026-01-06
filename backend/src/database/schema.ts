import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

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

export class OrderFlowDatabase {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = join(process.cwd(), 'data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS order_flows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        market_ticker TEXT NOT NULL,
        side TEXT NOT NULL CHECK(side IN ('yes', 'no')),
        action TEXT NOT NULL CHECK(action IN ('bid', 'ask', 'fill')),
        price REAL NOT NULL,
        size INTEGER NOT NULL,
        order_id TEXT,
        raw_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON order_flows(timestamp);
      CREATE INDEX IF NOT EXISTS idx_market_ticker ON order_flows(market_ticker);
      CREATE INDEX IF NOT EXISTS idx_action ON order_flows(action);
    `);
  }

  insertOrderFlow(orderFlow: OrderFlow): number {
    const stmt = this.db.prepare(`
      INSERT INTO order_flows (timestamp, market_ticker, side, action, price, size, order_id, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      orderFlow.timestamp,
      orderFlow.market_ticker,
      orderFlow.side,
      orderFlow.action,
      orderFlow.price,
      orderFlow.size,
      orderFlow.order_id || null,
      orderFlow.raw_data || null
    );

    return result.lastInsertRowid as number;
  }

  getRecentOrderFlows(limit: number = 100, marketTicker?: string): OrderFlow[] {
    let query = `
      SELECT * FROM order_flows
    `;
    
    const params: any[] = [];
    
    if (marketTicker) {
      query += ` WHERE market_ticker = ?`;
      params.push(marketTicker);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as OrderFlow[];
  }

  getOrderFlowsByTimeRange(startTime: number, endTime: number, marketTicker?: string): OrderFlow[] {
    let query = `
      SELECT * FROM order_flows
      WHERE timestamp >= ? AND timestamp <= ?
    `;
    
    const params: any[] = [startTime, endTime];
    
    if (marketTicker) {
      query += ` AND market_ticker = ?`;
      params.push(marketTicker);
    }
    
    query += ` ORDER BY timestamp DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as OrderFlow[];
  }

  getMarketStats(marketTicker: string, timeRangeMinutes: number = 60) {
    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    
    const stmt = this.db.prepare(`
      SELECT 
        action,
        side,
        COUNT(*) as count,
        SUM(size) as total_size,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM order_flows
      WHERE market_ticker = ? AND timestamp >= ?
      GROUP BY action, side
    `);

    return stmt.all(marketTicker, startTime);
  }

  close() {
    this.db.close();
  }
}
