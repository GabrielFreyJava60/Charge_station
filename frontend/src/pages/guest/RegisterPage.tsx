import { getLogger } from "@/services/logging";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import SignInForm from "@/components/SignInForm";

const logger = getLogger("LoginPage");


const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const signUpHandler = async (    email: string,password: string, confirmPassword?: string) => {
    if (password !== confirmPassword) {
      logger.debug("Passwords do not match ")
      return;
    }
    try {
      await signUp(email, password);
      logger.debug("Sign up successful");
      navigate("/confirm", { state: { email } });
    } catch (error) {
      logger.debug("Error while signing UP: ", error);
    }
  }

  return (
      <SignInForm submitHandler={signUpHandler} isRegister={true} />
  );
};

export default RegisterPage;