import { useState, useEffect, useCallback, useRef } from 'react'
import ChainStatus from './components/ChainStatus'
import BlockFeed from './components/BlockFeed'
import BlockExplorer from './components/BlockExplorer'
import TamperSim from './components/TamperSim'

export default function App() {
  const [liveFeed, setLiveFeed]           = useState([])
  const [verifyResult, setVerifyResult]   = useState(null)
  const [blockCount, setBlockCount]       = useState(0)
  const [wsConnected, setWsConnected]     = useState(false)
  const [refreshToken, setRefreshToken]   = useState(0)
  const [simulating, setSimulating]       = useState(false)
  const wsRef = useRef(null)

  const triggerRefresh = useCallback(() => setRefreshToken(t => t + 1), [])

  const connectWs = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen  = () => setWsConnected(true)
    ws.onclose = () => {
      setWsConnected(false)
      setTimeout(connectWs, 3000)
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.event === 'new_block') {
        setLiveFeed(prev => [msg.block, ...prev].slice(0, 20))
        setBlockCount(prev => prev + 1)
        triggerRefresh()
      } else if (msg.event === 'verify_result') {
        setVerifyResult(msg.result)
      } else if (msg.event === 'tampered') {
        triggerRefresh()
      }
    }
  }, [triggerRefresh])

  useEffect(() => {
    connectWs()
    return () => wsRef.current?.close()
  }, [connectWs])

  useEffect(() => {
    fetch('/stats')
      .then(r => r.json())
      .then(d => { setBlockCount(d.block_count); setSimulating(d.simulating) })
      .catch(() => {})
  }, [])

  const handleSimToggle = useCallback(async () => {
    const endpoint = simulating ? '/simulate/stop' : '/simulate/start'
    const res = await fetch(endpoint, { method: 'POST' })
    const data = await res.json()
    setSimulating(data.simulating)
  }, [simulating])

  const handleVerify = useCallback(async () => {
    const res = await fetch('/verify')
    const data = await res.json()
    setVerifyResult(data)
    return data
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-wordmark">
          Mnemosyne
          <span>// immutable register ledger</span>
        </div>
        <div className="ws-indicator">
          <div className={`ws-dot ${wsConnected ? 'connected' : 'disconnected'}`} />
          {wsConnected ? 'live' : 'reconnecting'}
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="span-full">
          <ChainStatus
            blockCount={blockCount}
            verifyResult={verifyResult}
            simulating={simulating}
            onVerify={handleVerify}
            onSimToggle={handleSimToggle}
          />
        </div>
        <BlockFeed blocks={liveFeed} />
        <BlockExplorer refreshToken={refreshToken} />
        <div className="span-full">
          <TamperSim onVerify={handleVerify} />
        </div>
      </div>
    </div>
  )
}
