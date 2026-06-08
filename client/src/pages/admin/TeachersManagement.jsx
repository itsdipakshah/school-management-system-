import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useApi from '@/hooks/UseApi'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit, Eye, MoreHorizontal, Plus, RefreshCcw, Search, Trash2 } from 'lucide-react'
import z from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(7, 'Phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  school: z.string().min(1, 'School is required'),
  teachSubject: z.string().min(1, 'Subject is required'),
  teachSclass: z.string().min(1, 'Class is required'),
})

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  school: '',
  teachSubject: '',
  teachSclass: '',
  salary: '',
  teacherAvatar: null,
}

const TeachersManagement = () => {
  const navigate = useNavigate()
  const { get, post, put, del } = useApi()
  const [teachers, setTeachers] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTeacherId, setEditingTeacherId] = useState(null)
  const [viewTeacher, setViewTeacher] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formState, setFormState] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await get('/teachers')
      if (response?.success && Array.isArray(response.teachers)) {
        setTeachers(response.teachers)
      } else if (Array.isArray(response)) {
        // fallback if controller returns array directly
        setTeachers(response)
      } else {
        toast.error('Unexpected teachers response from backend')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load teachers')
    }
  }, [get])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? '')
    window.addEventListener('adminSearch', handler)
    return () => window.removeEventListener('adminSearch', handler)
  }, [])

  const filteredTeachers = useMemo(() => {
    const lower = (searchTerm || '').toLowerCase()
    return teachers.filter((t) => {
      return (
        (t.name || '').toLowerCase().includes(lower) ||
        (t.email || '').toLowerCase().includes(lower) ||
        (t.teachSubject || '').toLowerCase().includes(lower)
      )
    })
  }, [teachers, searchTerm])

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setFormState((prev) => ({ ...prev, teacherAvatar: file }))
  }

  const openCreateDialog = () => {
    setFormState(initialFormState)
    setIsEditMode(false)
    setEditingTeacherId(null)
    setIsDialogOpen(true)
  }

  const handleView = (teacher) => {
    setViewTeacher(teacher)
    setIsViewOpen(true)
  }

  const handleEdit = (teacher) => {
    setFormState({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      password: '',
      school: teacher.school || '',
      teachSubject: teacher.teachSubject || '',
      teachSclass: teacher.teachSclass || '',
      salary: teacher.salary || '',
      teacherAvatar: null,
    })
    setEditingTeacherId(teacher._id || teacher.id)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEditMode) {
      const validation = createSchema.safeParse(formState)
      if (!validation.success) {
        toast.error(validation.error.errors[0].message)
        return
      }
      if (!formState.teacherAvatar) {
        toast.error('Teacher avatar is required')
        return
      }
    } else {
      if (!formState.name) {
        toast.error('Name is required')
        return
      }
    }

    const payload = new FormData()
    Object.entries(formState).forEach(([key, value]) => {
      if (key === 'teacherAvatar') return
      if (value !== null && value !== '') payload.append(key, value)
    })
    if (formState.teacherAvatar) payload.append('teacherAvatar', formState.teacherAvatar)

    try {
      setSubmitting(true)
      let response
      if (isEditMode && editingTeacherId) {
        response = await put(`/teachers/${editingTeacherId}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        response = await post('/teachers/register', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      if (response?.success) {
        toast.success(isEditMode ? 'Teacher updated' : 'Teacher registered')
        setIsDialogOpen(false)
        setIsEditMode(false)
        setEditingTeacherId(null)
        setFormState(initialFormState)
        await fetchTeachers()
        if (!isEditMode) navigate('/admin/dashboard', { replace: true })
      } else {
        toast.error(isEditMode ? 'Teacher update failed' : 'Teacher registration failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Could not save teacher')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (teacherId) => {
    try {
      await del(`/teachers/${teacherId}`)
      toast.success('Teacher deleted successfully')
      await fetchTeachers()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete teacher')
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchTeachers()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teachers</h2>
          <p className="text-muted-foreground">Manage teacher records and information</p>
        </div>

        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" />
          Add Teacher
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-150 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Full name" />
              <Input value={formState.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="Email address" type="email" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Phone number" type="tel" />
              <Input value={formState.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Password" type="password" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.school} onChange={(e) => handleInputChange('school', e.target.value)} placeholder="School" />
              <Input value={formState.teachSubject} onChange={(e) => handleInputChange('teachSubject', e.target.value)} placeholder="Subject" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.teachSclass} onChange={(e) => handleInputChange('teachSclass', e.target.value)} placeholder="Class" />
              <Input value={formState.salary} onChange={(e) => handleInputChange('salary', e.target.value)} placeholder="Salary" type="number" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Avatar</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setIsEditMode(false); setEditingTeacherId(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Teacher'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-150 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Teacher Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            {viewTeacher ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">{`${viewTeacher.name?.[0] ?? ''}`}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">{viewTeacher.name}</p>
                    <p className="text-sm text-muted-foreground">{viewTeacher.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Subject:</strong> {viewTeacher.teachSubject}</div>
                  <div><strong>Class:</strong> {viewTeacher.teachSclass}</div>
                  <div><strong>School:</strong> {viewTeacher.school}</div>
                  <div><strong>Phone:</strong> {viewTeacher.phone}</div>
                </div>
                <div><strong>Salary:</strong> {viewTeacher.salary}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No teacher selected.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or subject..." className="pl-10" />
            </div>
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Teachers</CardTitle>
          <CardDescription>Total teachers: {teachers.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Teacher</TableHead>
                <TableHead className="text-muted-foreground">Subject</TableHead>
                <TableHead className="text-muted-foreground">Class</TableHead>
                <TableHead className="text-muted-foreground">School</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher._id || teacher.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">{`${teacher.name?.[0] ?? ''}`}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{teacher.teachSubject}</TableCell>
                    <TableCell><Badge variant="outline">{teacher.teachSclass}</Badge></TableCell>
                    <TableCell className="text-foreground">{teacher.school}</TableCell>
                    <TableCell className="text-foreground">{teacher.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleView(teacher)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(teacher._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">{refreshing ? 'Refreshing...' : 'No teachers found.'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default TeachersManagement
