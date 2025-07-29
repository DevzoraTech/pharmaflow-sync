-- Create all tables for pharmacy management system

-- Users table (for staff/employees)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PHARMACIST' CHECK (role IN ('ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE NOT NULL,
  batch_number TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  allergies TEXT[], -- Array of allergy strings
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  doctor_name TEXT NOT NULL,
  issue_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'PARTIAL', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescription items table
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  quantity INTEGER NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT
);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  prescription_id UUID REFERENCES public.prescriptions(id),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'INSURANCE', 'CREDIT')),
  sale_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cashier_id UUID NOT NULL REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.users(id),
  date DATE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('STOCK', 'EXPIRY', 'SYSTEM', 'PRESCRIPTION')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Authenticated users can view all data" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all medicines" ON public.medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all prescriptions" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all prescription items" ON public.prescription_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view all alerts" ON public.alerts FOR SELECT TO authenticated USING (true);

-- Insert and update policies for all tables
CREATE POLICY "Authenticated users can insert medicines" ON public.medicines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update medicines" ON public.medicines FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prescriptions" ON public.prescriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert prescription items" ON public.prescription_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert sales" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert sale items" ON public.sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'PHARMACIST')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data
INSERT INTO public.medicines (name, generic_name, manufacturer, category, price, quantity, min_stock_level, expiry_date, batch_number, location) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Pharmaco Ltd', 'Analgesics', 500.00, 100, 20, '2025-12-31', 'PAR001', 'A1-001'),
('Amoxicillin 250mg', 'Amoxicillin', 'MedLife', 'Antibiotics', 1200.00, 50, 15, '2025-06-30', 'AMX001', 'A2-001'),
('Ibuprofen 400mg', 'Ibuprofen', 'HealthCare Inc', 'Anti-inflammatory', 800.00, 75, 20, '2025-08-15', 'IBU001', 'A1-002'),
('Cetirizine 10mg', 'Cetirizine', 'AllerCare', 'Antihistamines', 600.00, 30, 10, '2024-12-31', 'CET001', 'B1-001'),
('Metformin 500mg', 'Metformin', 'DiabetCare', 'Antidiabetics', 1500.00, 80, 25, '2025-10-20', 'MET001', 'C1-001');

INSERT INTO public.customers (name, email, phone, address) VALUES
('John Doe', 'john.doe@email.com', '+256701234567', 'Kampala, Uganda'),
('Jane Smith', 'jane.smith@email.com', '+256701234568', 'Entebbe, Uganda'),
('Robert Johnson', NULL, '+256701234569', 'Jinja, Uganda');

INSERT INTO public.alerts (type, title, message, severity) VALUES
('STOCK', 'Low Stock Alert', 'Cetirizine 10mg is running low (30 units remaining)', 'HIGH'),
('EXPIRY', 'Expiry Warning', 'Cetirizine 10mg expires on 2024-12-31', 'MEDIUM'),
('SYSTEM', 'Backup Reminder', 'Daily backup completed successfully', 'LOW'),
('STOCK', 'Critical Stock', 'Amoxicillin 250mg is critically low (50 units remaining)', 'CRITICAL');