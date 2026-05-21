import { useState, useEffect, useCallback } from 'react'

function hexAddr(n) {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}

function shortHash(h) {
  return h ? `${h.slice(0, 8)}...${h.slice(-8)}` : ''
}

function formatTs(iso) {
  return new Date(iso).toLocaleTimeString()
}

export default function BlockExplorer({ refreshToken }) {
  const [blocks, setBlocks]   = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchChain = useCallback(async () => {
    try {
      const res = await fetch('/chain?limit=50')
      const data = await res.json()
      setBlocks([...data].reverse())
    } catch {
      // backend not reachable
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChain()
  }, [fetchChain, refreshToken])

  const selectedBlock = blocks.find(b => b.index === selected) ?? null

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">block explorer</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--text-muted)' }}>
          last 50
        </span>
      </div>

      {loading ? (
        <div className="feed-empty">loading...</div>
      ) : (
        <>
          <div className="explorer-scroll">
            <table className="explorer-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>address</th>
                  <th>value</th>
                  <th>time</th>
                  <th>hash</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map(b => (
                  <tr
                    key={b.index}
                    className={selected === b.index ? 'selected' : ''}
                    onClick={() => setSelected(selected === b.index ? null : b.index)}
                  >
                    <td className="cell-index">{b.index}</td>
                    <td className="cell-addr">{hexAddr(b.register_address)}</td>
                    <td className="cell-value">{b.register_value}</td>
                    <td className="cell-time">{formatTs(b.timestamp)}</td>
                    <td className="cell-hash">{shortHash(b.hash)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedBlock && (
            <div className="block-detail">
              <div className="detail-row">
                <span className="detail-label">index</span>
                <span className="detail-value">{selectedBlock.index}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">timestamp</span>
                <span className="detail-value">{selectedBlock.timestamp}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">address</span>
                <span className="detail-value cyan">{hexAddr(selectedBlock.register_address)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">value</span>
                <span className="detail-value">
                  {selectedBlock.register_value} (0x{selectedBlock.register_value.toString(16).toUpperCase()})
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">hash</span>
                <span className="detail-value cyan">{selectedBlock.hash}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">prev hash</span>
                <span className="detail-value muted">{selectedBlock.previous_hash}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
