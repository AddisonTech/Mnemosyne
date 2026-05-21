import { useState } from 'react'

export default function ChainStatus({ blockCount, verifyResult, simulating, onVerify, onSimToggle }) {
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    await onVerify()
    setLoading(false)
  }

  const badge = () => {
    if (!verifyResult) {
      return <span className="badge badge-unknown">not verified</span>
    }
    if (verifyResult.intact) {
      return <span className="badge badge-intact">intact</span>
    }
    return (
      <span className="badge badge-tampered">
        tampered at block {verifyResult.first_bad_index}
      </span>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">chain status</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={onSimToggle}>
            {simulating ? 'stop simulator' : 'start simulator'}
          </button>
          <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
            {loading ? 'verifying...' : 'verify chain'}
          </button>
        </div>
      </div>
      <div className="stat-row">
        <div>
          <div className="stat-value">{blockCount.toLocaleString()}</div>
          <div className="stat-label">total blocks</div>
        </div>
        <div>
          <div style={{ paddingTop: 6 }}>{badge()}</div>
          <div className="stat-label" style={{ marginTop: 7 }}>integrity</div>
        </div>
        <div>
          <div style={{ paddingTop: 6 }}>
            <span className={`badge ${simulating ? 'badge-intact' : 'badge-unknown'}`}>
              {simulating ? 'simulating' : 'idle'}
            </span>
          </div>
          <div className="stat-label" style={{ marginTop: 7 }}>simulator</div>
        </div>
        {verifyResult && (
          <div>
            <div className="stat-value" style={{ fontSize: 16, paddingTop: 8, fontFamily: 'var(--ff-mono)' }}>
              {verifyResult.block_count.toLocaleString()} blocks
            </div>
            <div className="stat-label">last verified</div>
          </div>
        )}
      </div>
    </div>
  )
}
