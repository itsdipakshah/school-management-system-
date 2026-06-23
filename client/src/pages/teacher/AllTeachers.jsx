import React, { useCallback, useEffect, useState } from 'react'
import useApi from '@/hooks/UseApi'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Eye, GraduationCap, MapPin, Phone, Mail, Wallet } from 'lucide-react'

const AllTeachers = () => {
  const { get } = useApi()
  const [teachers, setTeachers] = useState([])
  const [viewTeacher, setViewTeacher] = useState(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await get('/teachers')
      if (response?.success && Array.isArray(response.teachers)) {
        setTeachers(response.teachers)
      } else if (Array.isArray(response)) {
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

  const handleView = (teacher) => {
    setViewTeacher(teacher)
    setIsViewOpen(true)
  }

  return (
    <div className="pl-16 pr-4 py-6">
      {/* Header section with total count */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Teachers</h2>
          <p className="text-muted-foreground">All the teachers information are here.</p>
        </div>
        <div className="text-sm font-medium bg-muted px-3 py-1.5 rounded-md">
          Total Teachers: {teachers.length}
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No teachers found.
          </div>
        ) : (
          teachers.map((teacher) => {
            return (
              <Card key={teacher._id} className="border-blue-300/50 shadow-sm hover:shadow-xl hover:shadow-green-900/10 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                  <Avatar className="h-14 w-14 border">
                    {/* Maps perfectly to your Cloudinary URL path */}
                    <AvatarImage src={teacher.teacherAvatar?.url} alt={teacher.name} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {teacher.name ? teacher.name.slice(0, 2).toUpperCase() : 'TR'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <CardTitle className="text-lg font-semibold line-clamp-1">{teacher.name}</CardTitle>
                    {/* Displays Subject and Class targeting your exact keys */}
                    <CardDescription className="text-sm font-medium text-primary/80">
                      {teacher.teachSubject} Teacher (Class {teacher.teachSclass})
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  <div className="text-sm space-y-2 border-t pt-4 text-muted-foreground">
                    <p className="truncate flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                      <span>{teacher.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                      <span>{teacher.phone}</span>
                    </p>
                  </div>

                
                  <div className="pt-2">
                    <Button 
                      className="w-full flex items-center justify-center gap-2" 
                      variant="outline"
                      onClick={() => handleView(teacher)}
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Detailed View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Teacher Profile Details</DialogTitle>
          </DialogHeader>
          
          {viewTeacher && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src={viewTeacher.teacherAvatar?.url} alt={viewTeacher.name} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                  {viewTeacher.name ? viewTeacher.name.slice(0, 2).toUpperCase() : 'TR'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="text-xl font-bold text-foreground">{viewTeacher.name}</h3>
                <p className="text-sm text-primary font-medium">
                 Teach {viewTeacher.teachSubject} 
                </p>
              </div>

              {/* Complete layout showing all backend details */}
              <div className="w-full text-left space-y-3 text-sm border-t pt-4 mt-2">
                <div className="flex items-start gap-2.5">
                  <GraduationCap className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="block font-semibold text-foreground">Assigned Class</span>
                    <span className="text-muted-foreground">Class {viewTeacher.teachSclass}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="block font-semibold text-foreground">School</span>
                    <span className="text-muted-foreground">{viewTeacher.school}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="block font-semibold text-foreground">Email Address</span>
                    <span className="text-muted-foreground">{viewTeacher.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="block font-semibold text-foreground">Phone Number</span>
                    <span className="text-muted-foreground">{viewTeacher.phone}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Wallet className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="block font-semibold text-foreground">Monthly Salary</span>
                    <span className="text-muted-foreground">Rs. {viewTeacher.salary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AllTeachers