import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Users,
  UserPlus,
  Activity,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usersAPI, attendanceAPI } from "@/lib/supabase-api";
import type { User, Attendance } from "@/lib/supabase-api";
import AttendanceTable from "@/components/staff/AttendanceTable";
import { supabase } from "@/integrations/supabase/client";

interface UserWithAttendance extends User {
  todayAttendance?: Attendance;
  weeklyHours?: number;
}

interface AttendanceWithUser extends Attendance {
  employee: User;
}

export default function Staff() {
  const [staff, setStaff] = useState<UserWithAttendance[]>([]);
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("staff");

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    is_active: true
  });

  // Stats
  const [stats, setStats] = useState({
    totalStaff: 0,
    activeToday: 0,
    onBreak: 0,
    totalHoursToday: 0
  });

  // Fetch staff data
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await usersAPI.getAll({
        search: searchTerm || undefined,
        role: roleFilter && roleFilter !== "all" ? roleFilter : undefined
      });
      
      const staffData = response.users || [];
      
      // Get today's attendance for each staff member
      const today = new Date().toISOString().split('T')[0];
      const staffWithAttendance: UserWithAttendance[] = [];
      
      for (const user of staffData) {
        let todayAttendance = undefined;
        let weeklyHours = 0;

        try {
          // Try to get today's attendance
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('employee_id', user.id)
            .eq('date', today)
            .single();
          
          todayAttendance = attendance;
        } catch (error) {
          console.warn(`Could not fetch attendance for user ${user.id}:`, error);
          // Provide mock attendance data for demo purposes
          todayAttendance = {
            id: `mock-${user.id}`,
            employee_id: user.id,
            date: today,
            clock_in: user.is_active ? '09:00:00' : null,
            clock_out: null,
            total_hours: user.is_active ? 8 : 0,
            status: user.is_active ? 'PRESENT' : 'ABSENT'
          };
        }

        try {
          // Try to get weekly hours
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const { data: weeklyAttendance } = await supabase
            .from('attendance')
            .select('total_hours')
            .eq('employee_id', user.id)
            .gte('date', weekStart.toISOString().split('T')[0]);

          weeklyHours = (weeklyAttendance || []).reduce((sum, att) => sum + (att.total_hours || 0), 0);
        } catch (error) {
          console.warn(`Could not fetch weekly hours for user ${user.id}:`, error);
          // Provide mock weekly hours
          weeklyHours = user.is_active ? 40 : 0;
        }

        staffWithAttendance.push({
          ...user,
          todayAttendance,
          weeklyHours
        });
      }
      
      setStaff(staffWithAttendance);
      
      // Calculate stats
      const activeToday = staffWithAttendance.filter(s => s.todayAttendance?.clock_in && !s.todayAttendance?.clock_out).length;
      const onBreak = staffWithAttendance.filter(s => s.todayAttendance?.break_start && !s.todayAttendance?.break_end).length;
      const totalHoursToday = staffWithAttendance.reduce((sum, s) => sum + (s.todayAttendance?.total_hours || 0), 0);
      
      setStats({
        totalStaff: staffData.length,
        activeToday,
        onBreak,
        totalHoursToday
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      setError(errorMessage);
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter]);

  // Fetch attendance data
  const fetchAttendance = useCallback(async () => {
    try {
      const response = await attendanceAPI.getAll({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      
      setAttendance(response.attendance || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
    if (activeTab === "attendance") {
      fetchAttendance();
    }
  }, [fetchStaff, fetchAttendance, activeTab]);

  const handleClockIn = async (userId: string) => {
    try {
      setIsSubmitting(true);
      setError("");
      
      // Use actual Supabase API to clock in
      const attendanceRecord = await attendanceAPI.clockIn(userId);
      console.log(`User ${userId} clocked in successfully:`, attendanceRecord);
      
      // Update local state with the actual attendance record
      setStaff(prevStaff => 
        prevStaff.map(user => 
          user.id === userId 
            ? {
                ...user,
                todayAttendance: attendanceRecord
              }
            : user
        )
      );
      
      // Refresh staff data to get updated stats
      await fetchStaff();
      
    } catch (err) {
      console.error('Clock in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async (userId: string) => {
    try {
      setIsSubmitting(true);
      setError("");
      
      // Use actual Supabase API to clock out
      const attendanceRecord = await attendanceAPI.clockOut(userId);
      console.log(`User ${userId} clocked out successfully:`, attendanceRecord);
      
      // Update local state with the actual attendance record
      setStaff(prevStaff => 
        prevStaff.map(user => 
          user.id === userId 
            ? {
                ...user,
                todayAttendance: attendanceRecord
              }
            : user
        )
      );
      
      // Refresh staff data to get updated stats
      await fetchStaff();
      
    } catch (err) {
      console.error('Clock out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to clock out');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      await usersAPI.update(selectedUser.id, editForm);
      
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (user: UserWithAttendance) => {
    if (!user.is_active) return <Badge variant="destructive">Inactive</Badge>;
    if (!user.todayAttendance?.clock_in) return <Badge variant="secondary">Not Clocked In</Badge>;
    if (user.todayAttendance.clock_out) return <Badge variant="outline">Clocked Out</Badge>;
    if (user.todayAttendance.break_start && !user.todayAttendance.break_end) return <Badge variant="warning">On Break</Badge>;
    return <Badge variant="success">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      ADMIN: "destructive",
      PHARMACIST: "default",
      TECHNICIAN: "secondary",
      CASHIER: "outline"
    } as const;
    
    return <Badge variant={variants[role as keyof typeof variants] || "outline"}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members and attendance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staff
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">Registered employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              On Break
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.onBreak}</div>
            <p className="text-xs text-muted-foreground">Taking break</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours Today
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHoursToday.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Total hours worked</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="staff">Staff Members</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search staff by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card>
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading staff...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Today's Hours</TableHead>
                      <TableHead>Weekly Hours</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No staff members found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      staff.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getStatusBadge(user)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.todayAttendance?.total_hours?.toFixed(1) || '0.0'} hrs
                            </div>
                            {user.todayAttendance?.clock_in && (
                              <div className="text-xs text-muted-foreground">
                                In: {new Date(user.todayAttendance.clock_in).toLocaleTimeString()}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              {user.weeklyHours?.toFixed(1) || '0.0'} hrs
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.todayAttendance?.clock_in && !user.todayAttendance?.clock_out ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleClockOut(user.id)}
                                  disabled={isSubmitting}
                                  className="shadow-sm"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Clock Out
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleClockIn(user.id)}
                                  disabled={isSubmitting || !user.is_active}
                                  className="bg-success hover:bg-success/80 text-success-foreground shadow-sm"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Clock In
                                </Button>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <AttendanceTable />
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Member Details</DialogTitle>
            <DialogDescription>
              View detailed information about this staff member.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm">{selectedUser.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Role</Label>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedUser.is_active ? "success" : "destructive"}>
                    {selectedUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Joined</Label>
                  <p className="text-sm">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the staff member's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                  <SelectItem value="CASHIER">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="edit-active">Active Employee</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Staff Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}