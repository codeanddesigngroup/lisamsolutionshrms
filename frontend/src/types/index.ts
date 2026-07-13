// Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee' | 'client';
  image?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Client Types
export interface Client {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'deactive';
  image?: string;
  client_detail?: {
    company_name: string;
    website?: string;
    mobile?: string;
    address?: string;
    shipping_address?: string;
  };
  projects?: Project[];
  invoices?: Invoice[];
  payments?: unknown[];
  contacts?: unknown[];
  notes?: unknown[];
  documents?: unknown[];
  gdpr_consents?: unknown[];
}

// Employee Types
export interface Employee {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'employee';
  status: 'active' | 'deactive';
  image?: string;
  gender?: string;
  mobile?: string;
  employee_detail?: {
    employee_id: string;
    joining_date: string;
    department_id?: number | string;
    designation_id?: number | string;
    shift_type_id?: number | string;
    mobile?: string;
    address?: string;
    hourly_rate?: number;
    slack_username?: string;
    designation?: { name: string };
    department?: { team_name: string };
    shift_type?: { id?: number | string; shift_name?: string; code?: string };
    custom_fields?: unknown[];
  };
  tasks_count?: number;
  hours_logged?: number;
  leaves_count?: number;
  allowed_leaves?: number;
}

// Project Types
export interface Project {
  id: number;
  project_name: string;
  project_summary?: string;
  start_date?: string;
  deadline: string;
  status: 'not started' | 'in progress' | 'on hold' | 'canceled' | 'finished';
  client?: Client;
  department?: {
    id: number;
    name: string;
  };
  members?: Employee[];
  total_earnings?: number;
}

// Task Types
export interface Task {
  id: number;
  heading: string;
  description: string;
  start_date: string;
  due_date: string;
  status: 'incomplete' | 'to do' | 'doing' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project?: Project;
  users?: Employee[];
  files?: unknown[];
  comments?: unknown[];
  notes?: unknown[];
  history?: unknown[];
  category?: {
    category_name?: string;
  };
  create_by?: Employee;
}

// Lead Types
export interface Lead {
  id: number | string;
  client_name?: string;
  name?: string;
  company_name?: string;
  company?: string;
  client_email?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  website?: string;
  value?: number | string;
  address?: string;
  message?: string;
  description?: string;
  source?: {
    type?: string;
  } | string;
  status?: {
    type?: string;
  } | string;
  proposals?: unknown[];
  files?: unknown[];
  followups?: unknown[];
  gdpr_consents?: unknown[];
  activities?: unknown[];
}

// Invoice Types
export interface Invoice {
  id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total: number;
  status: 'unpaid' | 'paid' | 'partial';
  project?: Project;
  client?: Client;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
