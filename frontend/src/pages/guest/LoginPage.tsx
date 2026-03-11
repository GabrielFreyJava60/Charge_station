import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from 'react-router';
import { useState } from "react";
import SignInForm from "@/components/SignInForm";
import { getLogger } from "@/services/logging";
import { type UserRole } from "@/types";

const logger = getLogger("LoginPage");

const NAV_PATH: Record<UserRole, string> = {
  USER: "/user",
  ADMIN: "/admin",
  SUPPORT: "/support",
};

const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const signInHandler = async(email: string, password: string) => {
    try {
      setErrorMessage(null);
      const user = await signIn(email, password);
      logger.debug("Signed In Successfully");
      if (!user?.userRole) {
        throw new Error("User role not found");
      }
      
      navigate(NAV_PATH[user.userRole]);
    }
    catch (error) {
      setErrorMessage(`Sign in failed: ${(error as Error).message}`);
      logger.debug("Error while signing IN: ", error);
    }
  }

  return (
    <>
      <SignInForm submitHandler={signInHandler} isRegister={false} />
      {errorMessage && <p>{errorMessage}</p>}
    </>
  );
};

export default LoginPage;