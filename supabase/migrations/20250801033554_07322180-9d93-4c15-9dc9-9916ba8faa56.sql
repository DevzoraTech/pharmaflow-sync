-- Create attendance table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIME,
  clock_out TIME,
  break_start TIME,
  break_end TIME,
  total_hours DECIMAL(4,2) DEFAULT 0,
  status TEXT DEFAULT 'ABSENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance table
CREATE POLICY "Users can view all attendance records" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their own attendance" 
ON public.attendance 
FOR UPDATE 
USING (auth.uid() = employee_id);

CREATE POLICY "Admins can manage all attendance" 
ON public.attendance 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'ADMIN'
  )
);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();