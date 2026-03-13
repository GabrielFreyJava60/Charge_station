import { useState, type FC } from "react";
import { useNavigate } from "react-router";

interface SignInFormProps{
  isRegister: boolean;
  submitHandler: (
    email: string,
    password: string,
    confirmPassword?: string,
    name?: string
  ) => void;
}

const SignInForm: FC<SignInFormProps> = ({isRegister, submitHandler}) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    submitHandler(email, password, confirmPassword, name);
  };

  return (
      <div className="loginForm">
      <h1>{isRegister?"SIGN UP PAGE": "LOGIN PAGE"}</h1>
      <h4>
          {isRegister ? "Sign up to create an account" : "Sign in to your account"}
      </h4>
      <form onSubmit={ handleSubmit }>
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
      {isRegister && (
        <div>
          <input
            className="inputText"
            id="name"
            type="text"
            value={name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
        </div>
      )}
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
    <button type="button" onClick={isRegister? () => navigate("/login"): () => navigate("/register")}>
      {isRegister
        ? "Already have an account? Sign In"
        : "Need an account? Sign Up"}
      </button>
  </div>
  );
};

export default SignInForm;