export type Company = {
  id: number | string;
  name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  status?: string;
  lastLogin?: string;
};

export type CompanyFormState = {
  name: string;
  email: string;
  status: string;
};

export type CreateCompanyAdminPayload = {
  company: {
    name: string;
    email: string;
    phone: string;
    website: string;
    status: string;
  };
  admin: {
    name: string;
    email: string;
    password: string;
    role: "admin";
  };
};
