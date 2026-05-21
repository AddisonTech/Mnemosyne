function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 5)    return 'just now'
  if (diff < 60)   return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function hexAddr(n) {
  return '0x' + n.toString(16).toUpperCase().padStart(4, '0')
}

export default function BlockFeed({ blocks }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">live feed</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--text-muted)' }}>
          last 20
        </span>
      </div>
      <div className="feed-list">
        {blocks.length === 0 ? (
          <div className="feed-empty">waiting for register data</div>
        ) : (
          blocks.map(b => (
            <div key={b.index} className="feed-item">
              <span className="feed-index">#{b.index}</span>
              <span className="feed-addr">{hexAddr(b.register_address)}</span>
              <span className="feed-value">{b.register_value}</span>
              <span className="feed-time">{timeAgo(b.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
