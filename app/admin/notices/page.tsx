'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, BellRing, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Notice } from '@/types'

type FormState = {
  title: string
  content: string
  is_active: boolean
}

const EMPTY: FormState = { title: '', content: '', is_active: true }

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchNotices() {
    setLoading(true)
    const res = await fetch('/api/admin/notices')
    const json = await res.json() as { notices: Notice[] }
    setNotices(json.notices ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchNotices() }, [])

  function openCreate() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
    setShowForm(true)
  }

  function openEdit(notice: Notice) {
    setEditId(notice.id)
    setForm({ title: notice.title, content: notice.content, is_active: notice.is_active })
    setError('')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('제목과 내용을 모두 입력하세요')
      return
    }
    setSubmitting(true)
    setError('')

    const url = editId ? `/api/admin/notices/${editId}` : '/api/admin/notices'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      await fetchNotices()
      cancelForm()
    } else {
      const json = await res.json() as { error?: string }
      setError(json.error ?? '오류가 발생했습니다')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return
    await fetch(`/api/admin/notices/${id}`, { method: 'DELETE' })
    await fetchNotices()
  }

  async function toggleActive(notice: Notice) {
    await fetch(`/api/admin/notices/${notice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !notice.is_active }),
    })
    await fetchNotices()
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">공지사항 관리</h1>
        </div>
        {!showForm && (
          <Button onClick={openCreate} size="sm">
            <Plus className="size-4" />
            공지 등록
          </Button>
        )}
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
        >
          <h2 className="font-semibold">{editId ? '공지 수정' : '새 공지 등록'}</h2>

          <div className="space-y-1.5">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="공지 제목"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">내용</Label>
            <textarea
              id="content"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="공지 내용을 입력하세요"
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="size-4 cursor-pointer"
            />
            <Label htmlFor="is_active" className="cursor-pointer">활성화 (팝업 노출)</Label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={cancelForm}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? '저장 중...' : editId ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      )}

      {/* 공지사항 목록 */}
      {loading ? (
        <p className="text-muted-foreground text-sm">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-10 text-center text-muted-foreground text-sm">
          등록된 공지사항이 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{notice.title}</span>
                    <Badge variant={notice.is_active ? 'default' : 'secondary'}>
                      {notice.is_active ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                    {notice.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    {new Date(notice.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(notice)}
                    title={notice.is_active ? '비활성화' : '활성화'}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  >
                    {notice.is_active ? <X className="size-4" /> : <Check className="size-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(notice)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
