"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Search,
  Eye,
  Calendar,
  Plus,
  UserPlus,
  X,
  BarChart3,
  TrendingUp,
  Clock,
  MessageSquare,
  Share2,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

interface SharedTask {
  id: number
  title: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate: string
  sharedBy: string
  sharedAt: string
  sharedVia: "whatsapp" | "link" | "email"
  completedBy?: string[]
  viewedBy?: string[]
}

interface TeamMember {
  id: number
  name: string
  email: string
  tasksShared: number
  tasksCompleted: number
  tasksReceived: number
  lastActive: string
  avatar?: string
  performance: number
  department: string
  role: string
}

interface CollaborationStats {
  totalShares: number
  whatsappShares: number
  linkShares: number
  emailShares: number
  totalCompletions: number
  averageCompletionTime: number
  activeUsers: number
  pendingTasks: number
}

interface CollaborationDashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function CollaborationDashboard({ isOpen, onClose }: CollaborationDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "shared" | "team" | "analytics">("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "high" | "medium" | "low">("all")
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("week")

  // Mock comprehensive data
  const [stats] = useState<CollaborationStats>({
    totalShares: 156,
    whatsappShares: 89,
    linkShares: 45,
    emailShares: 22,
    totalCompletions: 134,
    averageCompletionTime: 2.4,
    activeUsers: 12,
    pendingTasks: 23,
  })

  const [sharedTasks] = useState<SharedTask[]>([
    {
      id: 1,
      title: "Review marketing campaign",
      completed: true,
      priority: "high",
      dueDate: "Today",
      sharedBy: "Sarah Johnson",
      sharedAt: "2 hours ago",
      sharedVia: "whatsapp",
      completedBy: ["Mike Chen", "Alex Rivera"],
      viewedBy: ["Mike Chen", "Alex Rivera", "Emma Davis"],
    },
    {
      id: 2,
      title: "Prepare client presentation",
      completed: false,
      priority: "high",
      dueDate: "Tomorrow",
      sharedBy: "Mike Chen",
      sharedAt: "1 day ago",
      sharedVia: "link",
      viewedBy: ["Sarah Johnson", "Alex Rivera"],
    },
    {
      id: 3,
      title: "Update project documentation",
      completed: false,
      priority: "medium",
      dueDate: "This week",
      sharedBy: "Sarah Johnson",
      sharedAt: "2 days ago",
      sharedVia: "email",
      viewedBy: ["Mike Chen"],
    },
    {
      id: 4,
      title: "Team building event planning",
      completed: true,
      priority: "low",
      dueDate: "Next week",
      sharedBy: "Alex Rivera",
      sharedAt: "3 days ago",
      sharedVia: "whatsapp",
      completedBy: ["Sarah Johnson"],
      viewedBy: ["Sarah Johnson", "Mike Chen"],
    },
  ])

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@company.com",
      tasksShared: 8,
      tasksCompleted: 12,
      tasksReceived: 15,
      lastActive: "2 hours ago",
      performance: 92,
      department: "Marketing",
      role: "Manager",
    },
    {
      id: 2,
      name: "Mike Chen",
      email: "mike@company.com",
      tasksShared: 5,
      tasksCompleted: 9,
      tasksReceived: 11,
      lastActive: "1 day ago",
      performance: 85,
      department: "Development",
      role: "Senior Developer",
    },
    {
      id: 3,
      name: "Alex Rivera",
      email: "alex@company.com",
      tasksShared: 3,
      tasksCompleted: 7,
      tasksReceived: 8,
      lastActive: "3 days ago",
      performance: 78,
      department: "Design",
      role: "UI Designer",
    },
    {
      id: 4,
      name: "Emma Davis",
      email: "emma@company.com",
      tasksShared: 6,
      tasksCompleted: 11,
      tasksReceived: 13,
      lastActive: "5 hours ago",
      performance: 89,
      department: "Marketing",
      role: "Specialist",
    },
  ])

  const filteredTasks = sharedTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.sharedBy.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterBy === "all" || task.priority === filterBy
    return matchesSearch && matchesFilter
  })

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getShareMethodIcon = (method: string) => {
    switch (method) {
      case "whatsapp":
        return <MessageSquare className="h-3 w-3 text-green-500" />
      case "link":
        return <Share2 className="h-3 w-3 text-blue-500" />
      case "email":
        return <Calendar className="h-3 w-3 text-purple-500" />
      default:
        return <Share2 className="h-3 w-3" />
    }
  }

  const renderOverviewContent = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{stats.totalShares}</p>
              <p className="text-sm text-muted-foreground">Total Shares</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{stats.totalCompletions}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{stats.activeUsers}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold font-sans">{stats.averageCompletionTime}d</p>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sharing Methods Breakdown */}
      <Card className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold font-sans mb-4">Sharing Methods</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="font-medium">WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{stats.whatsappShares}</span>
              <div className="w-24 bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.whatsappShares / stats.totalShares) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Direct Link</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{stats.linkShares}</span>
              <div className="w-24 bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(stats.linkShares / stats.totalShares) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{stats.emailShares}</span>
              <div className="w-24 bg-muted rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${(stats.emailShares / stats.totalShares) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      <Card className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-semibold font-sans mb-4">Top Performers</h3>
        <div className="space-y-3">
          {teamMembers
            .sort((a, b) => b.performance - a.performance)
            .slice(0, 3)
            .map((member, index) => (
              <div key={member.id} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-white"
                        : index === 1
                          ? "bg-gray-400 text-white"
                          : "bg-orange-600 text-white"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">{member.performance}%</span>
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${member.performance}%` }} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )

  const renderAnalyticsContent = () => (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-sans">Analytics Dashboard</h3>
        <Select value={timeRange} onValueChange={(value: "week" | "month" | "quarter") => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Department Performance */}
      <Card className="glass-card p-6 rounded-2xl">
        <h4 className="font-semibold font-sans mb-4">Department Performance</h4>
        <div className="space-y-4">
          {["Marketing", "Development", "Design"].map((dept) => {
            const deptMembers = teamMembers.filter((m) => m.department === dept)
            const avgPerformance = deptMembers.reduce((acc, m) => acc + m.performance, 0) / deptMembers.length
            const totalTasks = deptMembers.reduce((acc, m) => acc + m.tasksCompleted, 0)

            return (
              <div key={dept} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{dept}</span>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{deptMembers.length} members</span>
                    <span>{totalTasks} tasks</span>
                    <span className="font-medium text-primary">{avgPerformance.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${avgPerformance}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Task Completion Trends */}
      <Card className="glass-card p-6 rounded-2xl">
        <h4 className="font-semibold font-sans mb-4">Task Completion Trends</h4>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
            const completions = Math.floor(Math.random() * 20) + 5
            const maxCompletions = 25
            return (
              <div key={day} className="text-center">
                <div className="h-20 bg-muted rounded-lg mb-2 flex items-end justify-center p-1">
                  <div
                    className="bg-primary rounded-sm w-full transition-all duration-500"
                    style={{ height: `${(completions / maxCompletions) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day}</span>
                <p className="text-xs font-medium">{completions}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Alerts and Notifications */}
      <Card className="glass-card p-6 rounded-2xl">
        <h4 className="font-semibold font-sans mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Alerts & Notifications
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">3 tasks overdue</p>
              <p className="text-xs text-muted-foreground">Requires immediate attention</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
              Review
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl">
            <Activity className="h-4 w-4 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Low team activity detected</p>
              <p className="text-xs text-muted-foreground">2 members inactive for 3+ days</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
              Check
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl">
            <Award className="h-4 w-4 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Team milestone achieved</p>
              <p className="text-xs text-muted-foreground">100+ tasks completed this month</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl bg-transparent">
              Celebrate
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <BarChart3 className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold font-sans">Team preview</h2>
                <p className="text-sm text-muted-foreground">Demo layout only. No live members or sync.</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border/20 mb-6 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "shared", label: "Shared Tasks", icon: Eye },
              { id: "team", label: "Team Members", icon: Users },
              { id: "analytics", label: "Analytics", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary bg-primary/10 border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Search and Filters */}
          {(activeTab === "shared" || activeTab === "team") && (
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === "shared" ? "Search shared tasks..." : "Search team members..."}
                  className="pl-10 glass rounded-xl"
                />
              </div>
              {activeTab === "shared" && (
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === "overview" && renderOverviewContent()}
            {activeTab === "analytics" && renderAnalyticsContent()}

            {activeTab === "shared" && (
              <div className="space-y-3">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <Card key={task.id} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${task.completed ? "bg-primary" : "bg-orange-500"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`font-serif ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}
                            >
                              {task.title}
                            </p>
                            {getShareMethodIcon(task.sharedVia)}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                task.priority === "high"
                                  ? "destructive"
                                  : task.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                              className="text-xs"
                            >
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Shared by {task.sharedBy} • {task.sharedAt}
                            </span>
                            {task.viewedBy && <span>👁 {task.viewedBy.length} views</span>}
                            {task.completedBy && <span>✅ {task.completedBy.length} completed</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-serif">
                      {searchQuery ? "No matching shared tasks found" : "No shared tasks yet"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start glass bg-transparent rounded-xl mb-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>

                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <Card key={member.id} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium font-sans text-foreground">{member.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-serif">{member.email}</p>
                          <p className="text-xs text-muted-foreground mb-2">{member.department}</p>
                          <div className="grid grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Shared:</span>
                              <span className="font-medium ml-1">{member.tasksShared}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Completed:</span>
                              <span className="font-medium ml-1">{member.tasksCompleted}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Received:</span>
                              <span className="font-medium ml-1">{member.tasksReceived}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Performance:</span>
                              <span className="font-medium ml-1 text-primary">{member.performance}%</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Last active: {member.lastActive}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" className="rounded-xl glass bg-transparent">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${member.performance}%` }} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-serif">
                      {searchQuery ? "No matching team members found" : "No team members yet"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-border/20">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl glass bg-transparent">
              Close
            </Button>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === "shared" ? "Share Tasks" : activeTab === "team" ? "Invite Member" : "Export Report"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
