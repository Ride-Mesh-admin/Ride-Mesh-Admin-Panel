import { LoginForm } from "@/components/auth/LoginForm";
import { getDevAdminCredentials } from "@/lib/server/adminCredentials";

export default function LoginPage() {
  return <LoginForm devCredentials={getDevAdminCredentials()} />;
}
