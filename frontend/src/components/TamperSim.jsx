import { useState } from 'react'

export default function TamperSim({ onVerify }) {
  const [blockIndex, setBlockIndex] = useState('')
  const [newValue, setNewValue]     = useState('')
  const [tampered, setTampered]     = useState(null)
  const [verifyResult, setVerifyResult] = useState(null)
  const [tampering, setTampering]   = useState(false)
  const [verifying, setVerifying]   = useState(false)

  const handleTamper = async () => {
    setTampering(true)
    setVerifyResult(null)
    try {
      const res = await fetch(`/tamper/${blockIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_value: parseInt(newValue) }),
      })
      if (res.ok) {
        setTampered({ success: true, index: parseInt(blockIndex), value: parseInt(newValue) })
      } else {
        setTampered({ success: false })
      }
    } catch {
      setTampered({ success: false })
    }
    setTampering(false)
  }

  const handleVerify = async () => {
    setVerifying(true)
    const result = await onVerify()
    setVerifyResult(result)
    setVerifying(false)
  }

  const canTamper = blockIndex !== '' && newValue !== '' && !tampering

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">tamper simulation</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--text-muted)' }}>
          demo only
        </span>
      </div>
      <p className="tamper-note">
        Directly mutates a block's stored value without updating its hash.
        Run verify to detect the corruption.
      </p>
      <div className="tamper-form">
        <div className="field">
          <label>block index</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 5"
            value={blockIndex}
            onChange={e => { setBlockIndex(e.target.value); setTampered(null); setVerifyResult(null) }}
          />
        </div>
        <div className="field">
          <label>new value</label>
          <input
            type="number"
            placeholder="e.g. 9999"
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
          />
        </div>
        <button className="btn btn-danger" onClick={handleTamper} disabled={!canTamper}>
          {tampering ? 'tampering...' : 'tamper block'}
        </button>
        {tampered?.success && (
          <button className="btn btn-ghost" onClick={handleVerify} disabled={verifying}>
            {verifying ? 'verifying...' : 'verify chain'}
          </button>
        )}
      </div>

      {tampered && !tampered.success && (
        <div className="result-box tampered">block {blockIndex} not found</div>
      )}
      {tampered?.success && !verifyResult && (
        <div className="result-box warn">
          block {tampered.index} value set to {tampered.value} -- hash unchanged. Run verify to detect.
        </div>
      )}
      {verifyResult && (
        <div className={`result-box ${verifyResult.intact ? 'intact' : 'tampered'}`}>
          {verifyResult.intact
            ? 'chain intact -- no corruption detected'
            : `tampering detected at block ${verifyResult.first_bad_index}`}
        </div>
      )}
    </div>
  )
}
