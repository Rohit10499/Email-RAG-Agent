import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Card, CardHeader, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/Loading'
import { 
  IconTimeline,
  IconRefresh,
  IconSearch,
  IconCopy,
  IconDownload,
  IconFilter,
  IconChevronLeft,
  IconChevronRight,
  IconAlertCircle,
  IconMail
} from '@tabler/icons-react'
import config from '../config'

function Logs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Filters & pagination (supported by backend)
  const [query, setQuery] = useState('')
  const [sender, setSender] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const hasPrev = offset > 0
  const hasNext = logs.length === limit

  const fetchLogs = useCallback(async () => {
    try {
      setError('')
      setLoading(true)
      const params = new URLSearchParams()
      if (query) params.append('query', query)
      if (sender) params.append('sender', sender)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      params.append('limit', String(limit))
      params.append('offset', String(offset))

      const res = await fetch(`${config.API_BASE}/logs?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(String(e))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [query, sender, startDate, endDate, limit, offset])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => {
      fetchLogs()
    }, 10000)
    return () => clearInterval(id)
  }, [autoRefresh, fetchLogs])

  const onSearch = () => {
    setOffset(0)
    fetchLogs()
  }

  const onClearFilters = () => {
    setQuery('')
    setSender('')
    setStartDate('')
    setEndDate('')
    setOffset(0)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time'
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const getStatus = (log) => {
    const valid = log?.validation_result?.is_valid
    return {
      text: valid ? 'Valid' : 'Escalated',
      cls: valid ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
    }
  }

  const handleCopy = () => {
    const text = logs.map(log =>
      `#${log.id}\nFrom: ${log.original_sender || 'Unknown'}\nSubject: ${log.subject || '—'}\nStatus: ${getStatus(log).text}\nTime: ${formatTimestamp(log.timestamp)}\nContent: ${log.email_content || '—'}\nReply: ${log.final_reply || '—'}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const handleExportCSV = () => {
    const headers = ['id','original_sender','subject','status','timestamp','email_content','final_reply']
    const rows = logs.map(l => ([
      l.id,
      `"${(l.original_sender || '').replace(/"/g,'""')}"`,
      `"${(l.subject || '').replace(/"/g,'""')}"`,
      getStatus(l).text,
      `"${formatTimestamp(l.timestamp)}"`,
      `"${(l.email_content || '').replace(/"/g,'""')}"`,
      `"${(l.final_reply || '').replace(/"/g,'""')}"`,
    ].join(',')))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${Date.now()}.csv`
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
              <IconTimeline className="w-8 h-8 text-blue-600" />
              Logs
            </h1>
            <p className="text-gray-600 mt-2">Search, filter and export processed email logs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleCopy} className="flex items-center gap-2">
              <IconCopy className="w-4 h-4" /> Copy
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2">
              <IconDownload className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => fetchLogs()} className="flex items-center gap-2">
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
                <Button variant="secondary" onClick={onClearFilters}>Clear</Button>
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
                <IconAlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-red-800 mb-1">Failed to load logs</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* List */}
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Results</h2>
              <span className="text-sm text-gray-500">Showing {logs.length} item(s)</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16">
                <Loading size="lg" text="Loading logs..." />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <IconMail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No logs found for current filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, index) => {
                  const status = getStatus(log)
                  return (
                    <div key={log.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">#{log.id || index + 1}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cls}`}>
                            {status.text}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{formatTimestamp(log.timestamp)}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">From</div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {log.original_sender || 'Unknown sender'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Subject</div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {log.subject || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">Email Content</div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                          {log.email_content || '—'}
                        </div>
                      </div>

                      {log.final_reply && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Reply</div>
                          <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded max-h-40 overflow-y-auto">
                            {log.final_reply}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && logs.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Offset {offset} — Showing {logs.length} item(s)
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

export default Logs