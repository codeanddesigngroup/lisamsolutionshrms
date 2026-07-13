const commonWeakPasswords = new Set([
  "12345678",
  "password",
  "password1",
  "password123",
  "admin123",
  "admin1234",
  "qwerty123",
  "letmein123",
  "welcome1",
  "welcome123",
]);

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAdminPassword = ({
  password,
  required,
  name,
  email,
  companyName,
}: {
  password: string;
  required: boolean;
  name: string;
  email: string;
  companyName: string;
}) => {
  const trimmedPassword = password.trim();
  const normalizedPassword = trimmedPassword.toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const emailName = normalizedEmail.split("@")[0] || "";

  if (!trimmedPassword) return required ? "Password is required for new admins." : "";
  if (trimmedPassword.length < 8) return "Password must be at least 8 characters.";
  if (commonWeakPasswords.has(normalizedPassword)) return "Use a unique password, not a common password.";

  const matchingIdentityValues = [name.trim().toLowerCase(), normalizedEmail, emailName, companyName.trim().toLowerCase()].filter(Boolean);
  if (matchingIdentityValues.includes(normalizedPassword)) {
    return "Password must be unique and cannot match the admin name, email, or company.";
  }

  return "";
};
