import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash2, Users, DoorOpen } from "lucide-react"
import useApi from '@/hooks/UseApi'
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import z from "zod"

//first create schema
const createSchema = z.object({
  sclassName: z.string().min(1, 'Class name is required'),
  section: z.string().min(1, 'Section is required'),
  roomNum: z.string().min(1, 'Room number is required'),
  school: z.string().min(1, 'School is required'),
  totalStudents: z.number().min(0, 'Total students cannot be negative').optional(),
});

const initialClasses = {
  sclassName: '',
  section: '',
  roomNum: '',
  school: '',
  totalStudents: 0,
}

const ClassesManagement = () => {
  const {post,put,del,get} = useApi();
  const [searchTerm, setSearchTerm] = useState("")
  const navigate = useNavigate();
  const [dependency, setDependency] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newClass, setNewClass] = useState(initialClasses)
  const [editingClass, setEditingClass] = useState(initialClasses)
  const [editingId, setEditingId] = useState(null)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, studentRes] = await Promise.all([
          get('/classes/all'),
          get('/students'),
        ])
        
        if (classRes?.classes && Array.isArray(classRes.classes)) {
          setClasses(classRes.classes)
        } else if (Array.isArray(classRes)) {
          setClasses(classRes)
        }

        if (studentRes?.students && Array.isArray(studentRes.students)) {
          setStudents(studentRes.students)
        } else if (Array.isArray(studentRes)) {
          setStudents(studentRes)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error('Failed to load class data')
      }
    }
    fetchData()
  }, [get, dependency])

  useEffect(() => {
    const handler = (e) => setSearchTerm(e.detail ?? '')
    window.addEventListener('adminSearch', handler)
    return () => window.removeEventListener('adminSearch', handler)
  }, [])

  const handleAddClass = async() => {
    try {
      createSchema.parse(newClass)
      const payload = {
        sclassName: newClass.sclassName,
        section: newClass.section,
        roomNum: newClass.roomNum,
        school: newClass.school,
      }
      const response = await post('/classes/create', payload)
      if (response?.success) {
        toast.success('Class created successfully')
        setDependency((p) => p + 1)
        setIsAddDialogOpen(false)
        setNewClass(initialClasses)
      } else {
        toast.error('Failed to create class')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'An error occurred while creating the class')
    }
  }

  const handleDeleteClass = async(classId) => {
    try{
      const response = await del(`/classes/${classId}`);
      if (response?.success) {
        toast.success("Class deleted successfully!");
        setDependency((prev) => prev + 1);
      } else {
        toast.error(response?.message || "Failed to delete class, try again");
      }
    }catch(error){
      console.error("Delete error:", error);
      toast.error("An error occurred while deleting the class. Please try again.");
    }
  }

  const handleEditClass = (cls) => {
    setEditingClass({
      sclassName: cls.sclassName,
      section: cls.section,
      roomNum: cls.roomNum,
      school: cls.school,
      totalStudents: cls.totalStudents || 0,
    })
    setEditingId(cls._id)
    setIsEditDialogOpen(true)
  }

  const handleUpdateClass = async () => {
    try {
      createSchema.parse(editingClass)
      const payload = {
        sclassName: editingClass.sclassName,
        section: editingClass.section,
        roomNum: editingClass.roomNum,
        school: editingClass.school,
      }
      const response = await put(`/classes/${editingId}`, payload)
      if (response?.success) {
        toast.success('Class updated successfully')
        setDependency((p) => p + 1)
        setIsEditDialogOpen(false)
        setEditingClass(initialClasses)
        setEditingId(null)
      } else {
        toast.error('Failed to update class')
      }
    } catch (error) {
      console.error(error)
      toast.error(error?.message || 'An error occurred while updating the class')
    }
  }

  const totalStudents = classes.reduce((total, cls) => {
    const classStudentCount = students.filter((student) => student.sclassName === cls.sclassName).length
    return total + classStudentCount
  }, 0)

  const getClassStudentCount = (className) => {
    return students.filter((student) => student.sclassName === className).length
  }
  const filteredClasses = classes.filter((cls) =>
    cls.sclassName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.roomNum.toLowerCase().includes(searchTerm.toLowerCase())
  );

  

  return (
     <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Classes</h2>
          <p className="text-muted-foreground">Manage class sections and assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Class</DialogTitle>
              <DialogDescription>
                Create a new class section with teacher assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sclassName">Class Name</Label>
                  <Select
                    value={newClass.sclassName}
                    onValueChange={(value) => setNewClass({ ...newClass, sclassName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={`Class ${i + 1}`}>
                          Class {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Select
                    value={newClass.section}
                    onValueChange={(value) => setNewClass({ ...newClass, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E"].map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          Section {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
             
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  placeholder="Enter school name"
                  value={newClass.school || ""}
                  onChange={(e) => setNewClass({ ...newClass, school: e.target.value })}
                />
              </div>
             
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomNum">Room Number</Label>
                  <Input
                    id="roomNum"
                    placeholder="Enter room number"
                    value={newClass.roomNum || ""}
                    onChange={(e) => setNewClass({ ...newClass, roomNum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="students">Total Students</Label>
                  <Input
                    id="students"
                    type="number"
                    placeholder="Enter capacity"
                    value={newClass.totalStudents || ""}
                    onChange={(e) =>
                      setNewClass({ ...newClass, totalStudents: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClass}>Add Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Class</DialogTitle>
              <DialogDescription>
                Update class section details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-sclassName">Class Name</Label>
                  <Select
                    value={editingClass.sclassName}
                    onValueChange={(value) => setEditingClass({ ...editingClass, sclassName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={`Class ${i + 1}`}>
                          Class {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-section">Section</Label>
                  <Select
                    value={editingClass.section}
                    onValueChange={(value) => setEditingClass({ ...editingClass, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E"].map((sec) => (
                        <SelectItem key={sec} value={sec}>
                          Section {sec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
             
              <div className="space-y-2">
                <Label htmlFor="edit-school">School</Label>
                <Input
                  id="edit-school"
                  placeholder="Enter school name"
                  value={editingClass.school || ""}
                  onChange={(e) => setEditingClass({ ...editingClass, school: e.target.value })}
                />
              </div>
             
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-roomNum">Room Number</Label>
                  <Input
                    id="edit-roomNum"
                    placeholder="Enter room number"
                    value={editingClass.roomNum || ""}
                    onChange={(e) => setEditingClass({ ...editingClass, roomNum: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-students">Total Students</Label>
                  <Input
                    id="edit-students"
                    type="number"
                    placeholder="Enter capacity"
                    value={editingClass.totalStudents || ""}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, totalStudents: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateClass}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DoorOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{classes.length}</p>
                <p className="text-sm text-muted-foreground">Total Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-2/10">
                <Users className="w-6 h-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-3/10">
                <Users className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {classes.length ? Math.round(totalStudents / classes.length) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg per Class</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Classes</CardTitle>
          <CardDescription>
            Manage class sections and teacher assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Class</TableHead>
                <TableHead className="text-muted-foreground">Section</TableHead>
                <TableHead className="text-muted-foreground">Room</TableHead>
                <TableHead className="text-muted-foreground">Students</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((cls) => (
                <TableRow key={cls._id || cls.id} className="border-border">
                  <TableCell className="font-medium text-foreground">{cls.sclassName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{cls.section}</Badge>
                  </TableCell>
                 
                  <TableCell className="text-foreground">Room {cls.roomNum}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{getClassStudentCount(cls.sclassName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleEditClass(cls)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive"
                          onClick={() =>handleDeleteClass(cls._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClasses.length === 0 && (
                <TableRow className="border-border">
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No classes found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClassesManagement