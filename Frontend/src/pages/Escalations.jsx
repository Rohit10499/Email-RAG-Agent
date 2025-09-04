import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/Loading'
import {
  IconBellRinging,
  IconFilter,
  IconAlertTriangle,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconMailOpened
} from '@tabler/icons-react'
import config from '../config'

function Escalations() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Filters & pagination (DB-backed)
  const [query, setQuery] = useState('')
  const [sender, setSender] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const hasPrev = offset > 0
  const hasNext = items.length === limit

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const fetchEscalations = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      // Backend escalation endpoint does not accept filters currently.
      // If you later add them, switch to query params similar to Logs.
      const res = await fetch(`${config.API_BASE}/email/escalations`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      // Client-side filter while backend filters are not implemented
      let filtered = Array.isArray(data) ? data : []
      if (query) {
        const q = query.toLowerCase()
        filtered = filtered.filter(x =>
          (x.email_content || '').toLowerCase().includes(q) ||
          (x.subject || '').toLowerCase().includes(q)
        )
      }
      if (sender) {
        const s = sender.toLowerCase()
        filtered = filtered.filter(x =>
          (x.original_sender || '').toLowerCase().includes(s)
        )
      }
      if (startDate) {
        filtered = filtered.filter(x =>
          (x.timestamp || '').slice(0, 10) >= startDate
        )
      }
      if (endDate) {
        filtered = filtered.filter(x =>
          (x.timestamp || '').slice(0, 10) <= endDate
        )
      }

      // Client-side pagination (simulates server paging)
      const sliced = filtered.slice(offset, offset + limit)
      setItems(sliced)
    } catch (e) {
      setError(String(e))
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [query, sender, startDate, endDate, limit, offset])

  useEffect(() => {
    fetchEscalations()
  }, [fetchEscalations])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchEscalations, 10000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchEscalations])

  const onSearch = () => {
    setOffset(0)
    fetchEscalations()
  }

  const onClear = () => {
    setQuery('')
    setSender('')
    setStartDate('')
    setEndDate('')
    setOffset(0)
  }

  const handleResolve = async (logId) => {
    try {
      const res = await fetch(`${config.API_BASE}/resolve-escalation/${logId}`, {
        method: 'POST'
      })
      if (!res.ok) throw new Error(`Failed to resolve #${logId} (HTTP ${res.status})`)
      // Optimistic remove from current page
      setItems(prev => prev.filter(x => x.id !== logId))
    } catch (e) {
      alert(e.message || 'Failed to resolve escalation')
    }
  }

  const handleExportCSV = () => {
    const headers = ['id','original_sender','subject','reason','timestamp','email_content','draft_reply','final_reply']
    const rows = items.map(it => ([
      it.id,
      `"${(it.original_sender || '').replace(/"/g,'""')}"`,
      `"${(it.subject || '').replace(/"/g,'""')}"`,
      `"${(it.validation_result?.reason || '').replace(/"/g,'""')}"`,
      `"${formatTimestamp(it.timestamp)}"`,
      `"${(it.email_content || '').replace(/"/g,'""')}"`,
      `"${(it.draft_reply || '').replace(/"/g,'""')}"`,
      `"${(it.final_reply || '').replace(/"/g,'""')}"`,
    ].join(',')))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `escalations_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconBellRinging className="w-8 h-8 text-red-600" />
              Escalations
            </h1>
            <p className="text-gray-600 mt-2">Investigate messages that need human attention and resolve them</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <IconDownload className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => fetchEscalations()} className="flex items-center gap-2">
              <IconRefresh className="w-4 h-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFilter className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
              </div>
              <label className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search content or subject"
                    className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <input
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Sender email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="primary" onClick={onSearch} className="flex items-center gap-2">
                  <IconSearch className="w-4 h-4" /> Apply
                </Button>
                <Button variant="secondary" onClick={onClear}>Clear</Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setOffset(0); }}
                  className="px-2 py-1 border rounded-lg"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50 my-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full mt-1">
                <IconAlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Failed to load escalations</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* List */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Open escalations</h2>
              <span className="text-sm text-gray-500">Showing {items.length} item(s)</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16">
                <Loading size="lg" text="Loading escalations..." />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <IconMailOpened className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No escalations found for current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id || index} className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">#{item.id || index + 1}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
                          Escalated
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{formatTimestamp(item.timestamp)}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">From</div>
                        <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                          {item.original_sender || 'Unknown sender'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Subject</div>
                        <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                          {item.subject || '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">Original Email</div>
                      <div className="text-sm text-gray-700 bg-white p-3 rounded border max-h-40 overflow-y-auto">
                        {item.email_content || '—'}
                      </div>
                    </div>

                    {item.draft_reply && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Draft Reply (Not Sent)</div>
                        <div className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200 max-h-40 overflow-y-auto">
                          {item.draft_reply}
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <div className="text-sm font-medium text-red-700 mb-1">Escalation Reason</div>
                      <div className="text-sm text-red-700 bg-red-100 p-3 rounded">
                        {item.validation_result?.reason || 'Unknown reason'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="success"
                        className="flex items-center gap-2"
                        onClick={() => handleResolve(item.id)}
                      >
                        <IconCheck className="w-4 h-4" />
                        Mark Resolved
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // Placeholder: open modal in future
                          alert('Manual reply flow coming soon')
                        }}
                      >
                        Reply Manually
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && items.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Offset {offset} — Showing {items.length} item(s)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={!hasPrev}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    className="flex items-center gap-2"
                  >
                    <IconChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!hasNext}
                    onClick={() => setOffset(offset + limit)}
                    className="flex items-center gap-2"
                  >
                    Next <IconChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Escalations