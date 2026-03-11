import { getLogger } from "@/services/logging";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";
import SignInForm from "@/components/SignInForm";

const logger = getLogger("LoginPage");


const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const signInHandler = async(email: string, password: string,) => {
    try {
      await signIn(email, password);
      logger.debug("Signed In Successfully");
      navigate("/user");
    }
    catch (error) {
      logger.debug("Error while signing IN: ", error);
    }
  }

  return (
      <SignInForm submitHandler={signInHandler} isRegister={false} />
  );
};

export default LoginPage;