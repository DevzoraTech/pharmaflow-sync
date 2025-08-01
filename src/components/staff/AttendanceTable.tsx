import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Clock,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { attendanceAPI, usersAPI } from "@/lib/supabase-api";
import type { Attendance, User } from "@/lib/supabase-api";

interface AttendanceWithUser extends Attendance {
  employee: User;
}

export default function AttendanceTable() {
  const [attendance, setAttendance] = useState<AttendanceWithUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await attendanceAPI.getAll({
        startDate: dateFilter,
        endDate: dateFilter
      });
      
      setAttendance(response.attendance || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendance';
      setError(errorMessage);
      console.error('Error fetching attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateFilter, searchTerm]);

  const getStatusBadge = (record: AttendanceWithUser) => {
    if (!record.clock_in) return <Badge variant="destructive">Absent</Badge>;
    if (record.clock_out) return <Badge variant="success">Complete</Badge>;
    return <Badge variant="warning">Active</Badge>;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString();
  };

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)} hrs`;
  };

  const filteredAttendance = attendance.filter(record =>
    searchTerm === "" || 
    record.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employee?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchAttendance} className="w-full sm:w-auto">
              <Clock className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records - {new Date(dateFilter).toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading attendance...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Break Start</TableHead>
                  <TableHead>Break End</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
                    <TableHead className="hidden sm:table-cell">Clock In</TableHead>
                    <TableHead className="hidden sm:table-cell">Clock Out</TableHead>
                    <TableHead className="hidden md:table-cell">Break Start</TableHead>
                    <TableHead className="hidden md:table-cell">Break End</TableHead>
                    <TableHead className="hidden lg:table-cell">Total Hours</TableHead>
                    <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.employee?.name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.employee?.email || ''}
                            {/* Show hours on mobile */}
                            <div className="lg:hidden mt-1">
                              <div className="text-xs text-muted-foreground">
                                Hours: {formatHours(record.total_hours)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {record.clock_in ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              {formatTime(record.clock_in)}
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              Not clocked in
                            </>
                          )}
                        </div>
                      </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {record.clock_out ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-success" />
                              {formatTime(record.clock_out)}
                            </>
                          ) : record.clock_in ? (
                            <>
                              <Clock className="h-4 w-4 text-warning" />
                              Still working
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                              -
                            </>
                          )}
                        </div>
                      </TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(record.break_start)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatTime(record.break_end)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                        <div className="font-medium">
                          {formatHours(record.total_hours)}
                        </div>
                      </TableCell>
                        <TableCell className="hidden lg:table-cell">
                        <div className="text-sm text-muted-foreground max-w-32 truncate">
                          {record.notes || '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}