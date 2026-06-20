import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useApi from '@/hooks/UseApi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, GraduationCap, BookOpen, DollarSign, Calendar, TrendingUp, UserPlus, Clock } from 'lucide-react'

const DashboardOverview = () => {
  const navigate = useNavigate()
  const { get } = useApi()
  const [counts, setCounts] = useState({})
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const [dashboardRes, feesRes] = await Promise.all([
          get('/admin/dashboard'),
          get('/fees')
        ])
        
        if (dashboardRes) {
          setCounts(dashboardRes)
        }

        if (feesRes) {
          const feesList = Array.isArray(feesRes) 
            ? feesRes 
            : (feesRes.fees || feesRes.data || [])
          
          const collectedSum = feesList.reduce((sum, record) => {
            if (record.status === 'Paid' || record.status === 'Success') {
              return sum + (Number(record.amount) || 0)
            }
            return sum
          }, 0)
          
          setTotalRevenue(collectedSum)
        }
      } catch (err) {
        console.error("Failed to aggregate dashboard overview data:", err)
      }
    }
    fetchOverviewData()
  }, [get])

  const mockWeeklyAttendance = [
    { day: "Mon", rate: 92 },
    { day: "Tue", rate: 95 },
    { day: "Wed", rate: 89 },
    { day: "Thu", rate: 94 },
    { day: "Fri", rate: 91 },
  ]

  const mockRecentRegistrations = [
    { id: 1, type: "student", name: "Ananya Sharma", detail: "Enrolled in Grade 11", time: "2 hrs ago" },
    { id: 2, type: "teacher", name: "Dr. Ramesh Thapa", detail: "Joined Physics Faculty", time: "5 hrs ago" },
    { id: 3, type: "student", name: "Bibek Khadka", detail: "Enrolled in Grade 9", time: "1 day ago" },
  ]

  const mockEvents = [
    { id: 1, title: "Mid-Term Examination", date: "June 24", label: "Academic" },
    { id: 2, title: "Parent-Teacher Meeting", date: "July 02", label: "Meeting" },
  ]

  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const daysArray = []
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null)
    }
    for (let d = 1; d <= totalDays; d++) {
      daysArray.push(d)
    }
    return daysArray
  }

  return (
    <div className="pl-16 pr-4 py-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalStudents ?? '—'}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalTeachers ?? '—'}</div>
            <p className="text-xs text-muted-foreground">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.totalClasses ?? '—'}</div>
            <p className="text-xs text-muted-foreground">All classes running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              { `₹${counts.totalFees ?? '_'}`  }
            </div>
            <p className="text-xs text-muted-foreground">Live from Fees Ledger</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Attendance Tracker Trend (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-48 w-full flex items-end justify-between px-2 border-b border-border relative">
              <div className="absolute left-0 top-0 h-full w-full flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-t border-dashed border-muted-foreground w-full text-[10px]">100%</div>
                <div className="border-t border-dashed border-muted-foreground w-full text-[10px]">50%</div>
                <div className="w-full text-[10px]">0%</div>
              </div>
              {mockWeeklyAttendance.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  <div className="text-xs font-medium mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.rate}%
                  </div>
                  <div 
                    style={{ height: `${item.rate}%` }} 
                    className="w-8 bg-primary rounded-t transition-all duration-500 hover:bg-primary/80"
                  />
                  <span className="text-xs text-muted-foreground mt-2">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> 
              {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {generateCalendarDays().map((day, index) => {
                const isToday = day === new Date().getDate() && selectedDate.getMonth() === new Date().getMonth();
                return (
                  <div 
                    key={index} 
                    className={`p-2 rounded ${
                      !day ? 'opacity-0' : 
                      isToday ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted cursor-pointer'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Recent Onboardings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentRegistrations.map((item) => (
              <div key={item.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.name}</p>
                    <Badge variant={item.type === 'teacher' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {item.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Upcoming Campus Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockEvents.map((ev) => (
              <div key={ev.id} className="p-3 bg-muted/50 rounded border-l-4 border-primary space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-primary">{ev.date}</span>
                  <Badge variant="outline" className="text-[10px]">{ev.label}</Badge>
                </div>
                <h4 className="text-sm font-medium text-foreground">{ev.title}</h4>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Operations Logs</CardTitle>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Quick Actions Panel</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="p-3 text-center text-sm font-medium rounded border border-border bg-card hover:bg-muted transition-colors"
          >
            Manage Students
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="p-3 text-center text-sm font-medium rounded border border-border bg-card hover:bg-muted transition-colors"
          >
            Manage Teachers
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="p-3 text-center text-sm font-medium rounded border border-border bg-card hover:bg-muted transition-colors"
          >
            Take Attendance
          </button>
          <button 
            onClick={() => navigate('/admin/dashboard')} 
            className="p-3 text-center text-sm font-medium rounded border border-border bg-card hover:bg-muted transition-colors"
          >
            Fees Management
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardOverview