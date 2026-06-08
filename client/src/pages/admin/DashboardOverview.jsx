import React, { useEffect, useState } from 'react'
import useApi from '@/hooks/UseApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BookOpen, DollarSign } from 'lucide-react'

const DashboardOverview = () => {
  const { get } = useApi()
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await get('/admin/dashboard')
        if (res) setCounts(res)
      } catch (err) {
        console.error(err)
      }
    }
    fetchOverview()
  }, [get])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalStudents ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalTeachers ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              +2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalClasses ?? '—'}</div>
            <p className="text-xs text-muted-foreground">
              All classes running
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalPendingFees ? `₹${counts.totalPendingFees}` : '—'}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">New</Badge>
              <div>
                <p className="text-sm font-medium">Student Enrollment</p>
                <p className="text-xs text-muted-foreground">Rahul Kumar joined Class 10</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Payment</Badge>
              <div>
                <p className="text-sm font-medium">Fee Payment</p>
                <p className="text-xs text-muted-foreground">₹25,000 received from Priya Patel</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Leave</Badge>
              <div>
                <p className="text-sm font-medium">Teacher Leave</p>
                <p className="text-xs text-muted-foreground">Mrs. Sunita Rao requested leave</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              Add New Student
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              Create Notice
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              Schedule Event
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-muted">
              Generate Report
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardOverview