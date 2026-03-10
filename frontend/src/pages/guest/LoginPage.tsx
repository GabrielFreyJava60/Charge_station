import { useState } from "react";
import { getLogger } from "@/services/logging";

const logger = getLogger("SignIn");

const handleSignUp = () => { logger.debug("Signing up") };
const handleSignIn = () => { logger.debug("Signing In") };

const LoginPage = () => {
    const [isRegister, setIsRegister] = useState<boolean>(false);
    const [email, setEmail] = useState<string | undefined>(undefined);
    const [password, setPassword] = useState<string | undefined>(undefined);
    const [confirmPassword, setConfirmPassword] = useState<string | undefined>(undefined);
    return (
        <div className="loginForm">
        <h1>LOGIN PAGE</h1>
        <h4>
            {isRegister ? "Sign up to create an account" : "Sign in to your account"}
        </h4>
        <form onSubmit={isRegister ? handleSignUp : handleSignIn}>
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
    </div>
    );
};

export default LoginPage;