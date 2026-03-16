import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from 'react-router-dom';
import { useState } from "react";
import SignInForm from "@/components/SignInForm";
import { getLogger } from "@/services/logging";
import { APP_PATH } from "@/router/roleNavigation";

const logger = getLogger("LoginPage");


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
      
      navigate(APP_PATH);
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