import React from 'react';
import { ROWS, LABEL_W, CELL_H } from '../constants.js';

export default function RowLabels() {
  return (
    <div style={{
      width: LABEL_W,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #e5e5e5',
      background: '#fafafa',
      userSelect: 'none',
    }}>
      {ROWS.map(row => (
        <div
          key={row.id}
          style={{
            height: CELL_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 6,
            backgroundColor: row.isBlackKey ? 'rgba(0,0,0,0.04)' : 'transparent',
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: row.isBlackKey ? 400 : 500,
              color: row.isBlackKey ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.55)',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}
