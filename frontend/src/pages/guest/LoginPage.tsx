import { useState } from "react";
import { getLogger } from "@/services/logging";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";

const logger = getLogger("LoginPage");


const LoginPage = () => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const signInHandler = async(e: { preventDefault: () => void }) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      logger.debug("Signed In Successfully")
      navigate("/user");
    }
    catch (error) {
      logger.debug("Error while signing IN")
      setErrorMsg((error as Error).message);
    }
  }

  const signUpHandler = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    try {
      await signUp(email, password);
      logger.debug("Sign up successful");
      navigate("/confirm", { state: { email } });
    } catch (error) {
      logger.debug("Error while signing UP")
      setErrorMsg(`Sign up failed: ${error}`);
    }
  }

  return (
      <div className="loginForm">
      <h1>LOGIN PAGE</h1>
      <h4>
          {isRegister ? "Sign up to create an account" : "Sign in to your account"}
      </h4>
      <form onSubmit={isRegister ? signUpHandler : signInHandler}>
      <div>
        <input
          className="inputText"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
      </div>
      <div>
        <input
          className="inputText"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
      </div>
      {isRegister && (
        <div>
          <input
            className="inputText"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
        </div>
      )}
      <button type="submit">{isRegister ? "Sign Up" : "Sign In"}</button>
    </form>
    <button type="button" onClick={() => setIsRegister(!isRegister)}>
      {isRegister
        ? "Already have an account? Sign In"
        : "Need an account? Sign Up"}
      </button>
      {errorMsg ? <p>{ errorMsg }</p>: <></>}
  </div>
  );
};

export default LoginPage;