import { getLogger } from "@/services/logging";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import SignInForm from "@/components/SignInForm";
import { useState } from "react";

const logger = getLogger("LoginPage");


const RegisterPage = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { signUp } = useAuth();

  const signUpHandler = async (email: string, password: string, confirmPassword?: string, name?: string) => {
    if (password !== confirmPassword) {
      logger.debug("Passwords do not match");
      setErrorMessage("Passwords do not match");
      return;
    }
    if (!name) {
      setErrorMessage("Name is required");
      return;
    }
    try {
      await signUp(email, password, name);
      logger.debug("Sign up successful");
      navigate("/confirm", { state: { email } });
    } catch (error) {
      setErrorMessage(`Sign up failed: ${(error as Error).message}`);
      logger.debug("Error while signing UP: ", error);
    }
  }
  
  return (
    <>
      <SignInForm submitHandler={signUpHandler} isRegister={true} />
      {errorMessage && <p>{ errorMessage }</p>}
    </>
  );
};

export default RegisterPage;