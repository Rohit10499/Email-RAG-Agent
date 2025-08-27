import React, { useEffect, useState } from 'react'
import API_BASE from '../config'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/logs`)
        const data = await res.json()
        setLogs(data.logs || [])
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">🕑 Logs</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <pre className="whitespace-pre-wrap text-sm">
            {logs.length ? logs.join('\n') : 'No logs yet.'}
          </pre>
        )}
      </div>
    </div>
  )
}

export default Logs
