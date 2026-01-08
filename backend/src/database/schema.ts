import initSqlJs, { Database } from 'sql.js';
import { join, dirname } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

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
  private db: Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
    // Ensure directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    const SQL = await initSqlJs();
    
    // Load existing database if it exists
    if (existsSync(this.dbPath)) {
      try {
        const buffer = readFileSync(this.dbPath);
        this.db = new SQL.Database(buffer);
      } catch (error) {
        console.log('Creating new database');
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }
    
    this.initializeSchema();
    this.initialized = true;
  }

  async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
  }

  private initializeSchema() {
    if (!this.db) return;
    
    this.db.run(`
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
      )
    `);

    this.db.run(`CREATE INDEX IF NOT EXISTS idx_timestamp ON order_flows(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_market_ticker ON order_flows(market_ticker)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_action ON order_flows(action)`);
    
    this.save();
  }

  private save() {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
  }

  insertOrderFlow(orderFlow: OrderFlow): number {
    if (!this.db) return -1;
    
    this.db.run(
      `INSERT INTO order_flows (timestamp, market_ticker, side, action, price, size, order_id, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderFlow.timestamp,
        orderFlow.market_ticker,
        orderFlow.side,
        orderFlow.action,
        orderFlow.price,
        orderFlow.size,
        orderFlow.order_id || null,
        orderFlow.raw_data || null
      ]
    );
    
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    this.save();
    
    return result[0]?.values[0]?.[0] as number || -1;
  }

  getRecentOrderFlows(limit: number = 100, marketTicker?: string): OrderFlow[] {
    if (!this.db) return [];
    
    let query = `SELECT * FROM order_flows`;
    const params: any[] = [];
    
    if (marketTicker) {
      query += ` WHERE market_ticker = ?`;
      params.push(marketTicker);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const result = this.db.exec(query, params);
    return this.mapResults(result);
  }

  getOrderFlowsByTimeRange(startTime: number, endTime: number, marketTicker?: string): OrderFlow[] {
    if (!this.db) return [];
    
    let query = `SELECT * FROM order_flows WHERE timestamp >= ? AND timestamp <= ?`;
    const params: any[] = [startTime, endTime];
    
    if (marketTicker) {
      query += ` AND market_ticker = ?`;
      params.push(marketTicker);
    }
    
    query += ` ORDER BY timestamp DESC`;

    const result = this.db.exec(query, params);
    return this.mapResults(result);
  }

  getMarketStats(marketTicker: string, timeRangeMinutes: number = 60) {
    if (!this.db) return [];
    
    const startTime = Date.now() - (timeRangeMinutes * 60 * 1000);
    
    const result = this.db.exec(`
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
    `, [marketTicker, startTime]);

    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  }

  private mapResults(result: any[]): OrderFlow[] {
    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    return result[0].values.map((row: any[]) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as OrderFlow;
    });
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}
