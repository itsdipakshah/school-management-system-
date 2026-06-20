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
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  rollNum: z.string().min(1, 'Roll number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  schoolName: z.string().min(1, 'School name is required'),
  sclassName: z.string().min(1, 'Class is required'),
})

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  dob: '',
  rollNum: '',
  password: '',
  phone: '',
  address: '',
  schoolName: '',
  sclassName: '',
  studentAvatar: null,
}

const StudentsManagement = () => {
  const navigate = useNavigate()
  const { get, post, put, del } = useApi()
  const [students, setStudents] = useState([])
  const [availableClasses, setAvailableClasses] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [formState, setFormState] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const [filterOptions, setFilterOptions] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchStudents = useCallback(async () => {
    try {
      const response = await get('/students')
      if (response?.success && Array.isArray(response.students)) {
        setStudents(response.students)
        const classes = Array.from(
          new Set(response.students.map((s) => s.sclassName).filter(Boolean)),
        )
        setFilterOptions(classes)
      } else {
        toast.error('Unexpected student response from backend')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load students')
    }
  }, [get])

  const fetchClasses = useCallback(async () => {
    try {
      const response = await get('/classes/all')
      if (response?.classes && Array.isArray(response.classes)) {
        setAvailableClasses(response.classes)
      } else if (Array.isArray(response)) {
        setAvailableClasses(response)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }, [get])

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [fetchStudents, fetchClasses])

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? '')
    window.addEventListener('adminSearch', handler)
    return () => window.removeEventListener('adminSearch', handler)
  }, [])

  const filteredStudents = useMemo(() => {
    const lowerSearch = (searchTerm || '').toLowerCase()
    return students.filter((student) => {
      const firstName = String(student.firstName || '')
      const lastName = String(student.lastName || '')
      const email = String(student.email || '')
      const rollNum = String(student.rollNum || '')

      const matchesSearch =
        firstName.toLowerCase().includes(lowerSearch) ||
        lastName.toLowerCase().includes(lowerSearch) ||
        email.toLowerCase().includes(lowerSearch) ||
        rollNum.toLowerCase().includes(lowerSearch)
      const matchesClass = classFilter === 'all' || student.sclassName === classFilter
      return matchesSearch && matchesClass
    })
  }, [students, searchTerm, classFilter])

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setFormState((prev) => ({ ...prev, studentAvatar: file }))
  }

  const openCreateDialog = () => {
    setFormState(initialFormState)
    setIsEditMode(false)
    setEditingStudentId(null)
    setIsDialogOpen(true)
  }

  const handleView = (student) => {
    setViewStudent(student)
    setIsViewOpen(true)
  }

  //edit actions handler
  const handleEdit = (student) => {
    setFormState({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      dob: student.dob ? String(student.dob).split('T')[0] : '',
      rollNum: student.rollNum || '',
      password: '',
      phone: student.phone || '',
      address: student.address || '',
      schoolName: student.schoolName || '',
      sclassName: student.sclassName || '',
      studentAvatar: null,
    })
    setEditingStudentId(student._id || student.id)
    setIsEditMode(true)
    setIsDialogOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isEditMode) {
      const validation = createSchema.safeParse(formState)
      if (!validation.success) {
        const errorMessage = validation.error?.errors?.[0]?.message || "Validation failed"
        toast.error(errorMessage)
        return
      }
      if (!formState.studentAvatar) {
        toast.error('Student avatar is required')
        return
      }
    } else {
      if (!formState.firstName || !formState.lastName) {
        toast.error('First and last name are required')
        return
      }
    }

    const payload = new FormData()
    Object.entries(formState).forEach(([key, value]) => {
      if (key === 'studentAvatar') return
      if (value !== null && value !== '') payload.append(key, value)
    })
    if (formState.studentAvatar) payload.append('studentAvatar', formState.studentAvatar)

    try {
      setSubmitting(true)
      let response
      if (isEditMode && editingStudentId) {
        response = await put(`/students/${editingStudentId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        response = await post('/students/register', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      if (response?.success) {
        toast.success(isEditMode ? 'Student updated successfully' : 'Student registered successfully')
        setIsDialogOpen(false)
        setIsEditMode(false)
        setEditingStudentId(null)
        setFormState(initialFormState)
        await fetchStudents()
        if (!isEditMode) navigate('/admin/dashboard', { replace: true })
      } else {
        toast.error(isEditMode ? 'Student update failed' : 'Student registration failed')
      }
    } catch (error) {
      console.error(error)
      toast.error(typeof error === 'string' ? error : 'Could not save student')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (studentId) => {
   
    try {
      await del(`/students/${studentId}`)
      toast.success('Student deleted successfully')
      await fetchStudents()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete student')
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchStudents()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="pl-16 pr-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Students</h2>
          <p className="text-muted-foreground">Manage student records and information</p>
        </div>

        <Button className="gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Create ra Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-150 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{isEditMode ? 'Edit Student' : 'Add New Student'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} placeholder="First name" />
              <Input value={formState.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} placeholder="Last name" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="Email address" type="email" />
              <Input value={formState.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Phone number" type="tel" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.dob} onChange={(e) => handleInputChange('dob', e.target.value)} placeholder="Date of birth" type="date" />
              <Input value={formState.rollNum} onChange={(e) => handleInputChange('rollNum', e.target.value)} placeholder="Roll number" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={formState.schoolName} onChange={(e) => handleInputChange('schoolName', e.target.value)} placeholder="School name" />
              <Select value={formState.sclassName} onValueChange={(value) => handleInputChange('sclassName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((cls) => (
                    <SelectItem key={cls._id || cls.id} value={cls.sclassName}>
                      {cls.sclassName} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input value={formState.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Address" />

            <Input value={formState.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Password" type="password" />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Avatar</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => { setIsDialogOpen(false); setIsEditMode(false); setEditingStudentId(null); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Student'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog ko lagi code*/}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-150 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Student Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            {viewStudent ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">{`${viewStudent.firstName?.[0] ?? ''}${viewStudent.lastName?.[0] ?? ''}`}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">{viewStudent.firstName} {viewStudent.lastName}</p>
                    <p className="text-sm text-muted-foreground">{viewStudent.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>Roll:</strong> {viewStudent.rollNum}</div>
                  <div><strong>Class:</strong> {viewStudent.sclassName}</div>
                  <div><strong>School:</strong> {viewStudent.schoolName}</div>
                  <div><strong>Phone:</strong> {viewStudent.phone}</div>
                </div>
                <div><strong>Address:</strong> {viewStudent.address}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No student selected.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or roll number..." className="pl-10" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.map((className) => (
                  <SelectItem key={className} value={className}>{className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Students</CardTitle>
          <CardDescription>Total students: {students.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Student</TableHead>
                <TableHead className="text-muted-foreground">Roll No.</TableHead>
                <TableHead className="text-muted-foreground">Class</TableHead>
                <TableHead className="text-muted-foreground">School</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student._id || student.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">{`${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{student.rollNum}</TableCell>
                    <TableCell><Badge variant="outline">{student.sclassName}</Badge></TableCell>
                    <TableCell className="text-foreground">{student.schoolName}</TableCell>
                    <TableCell className="text-foreground">{student.email}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handleView(student)}>
                            <Eye className="w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEdit(student)}>
                            <Edit className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDelete(student._id)}>
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">{refreshing ? 'Refreshing...' : 'No students found.'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentsManagement
