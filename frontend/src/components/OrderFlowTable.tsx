import React from 'react';
import { OrderFlow } from '../services/api';
import './OrderFlowTable.css';

interface OrderFlowTableProps {
  orderFlows: OrderFlow[];
}

export const OrderFlowTable: React.FC<OrderFlowTableProps> = ({ orderFlows }) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'fill':
        return '#4ade80';
      case 'bid':
        return '#60a5fa';
      case 'ask':
        return '#f87171';
      default:
        return '#9ca3af';
    }
  };

  const getSideColor = (side: string) => {
    return side === 'yes' ? '#22c55e' : '#ef4444';
  };

  return (
    <div className="order-flow-table">
      <h2>Recent Order Flows</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Market</th>
              <th>Side</th>
              <th>Action</th>
              <th>Price</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {orderFlows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No order flows yet. Waiting for data...
                </td>
              </tr>
            ) : (
              orderFlows.map((flow, index) => (
                <tr key={flow.id || index}>
                  <td>{formatTime(flow.timestamp)}</td>
                  <td>
                    <code>{flow.market_ticker}</code>
                  </td>
                  <td>
                    <span
                      style={{
                        color: getSideColor(flow.side),
                        fontWeight: 'bold',
                      }}
                    >
                      {flow.side.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        color: getActionColor(flow.action),
                        fontWeight: 'bold',
                      }}
                    >
                      {flow.action.toUpperCase()}
                    </span>
                  </td>
                  <td>${flow.price.toFixed(2)}</td>
                  <td>{flow.size}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
