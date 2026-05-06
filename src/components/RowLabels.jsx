import React from 'react';
import { ROWS, LABEL_W, CELL_H } from '../constants.js';

const DRUM_START = ROWS.findIndex(r => r.type !== 'piano');

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
      {ROWS.map((row, i) => {
        const isDrumSep = i === DRUM_START;
        return (
          <div
            key={row.id}
            style={{
              height: CELL_H,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 6,
              gap: 4,
              borderTop: isDrumSep ? '1.5px solid rgba(0,0,0,0.2)' : 'none',
              backgroundColor: row.type === 'piano' && row.isBlackKey
                ? 'rgba(0,0,0,0.04)'
                : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: row.type === 'piano' ? 9 : 10,
                fontWeight: row.type !== 'piano' ? 700 : row.isBlackKey ? 400 : 500,
                color: row.type !== 'piano'
                  ? row.color
                  : row.isBlackKey
                    ? 'rgba(0,0,0,0.3)'
                    : 'rgba(0,0,0,0.55)',
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {row.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
