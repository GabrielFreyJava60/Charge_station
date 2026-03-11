import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { confirmSignUp } from "@/services/auth/authService";

import { getLogger } from "@/services/logging";

const logger = getLogger("ConfirmPage");

const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleSubmit = async (e: {preventDefault: () => void}) => {
    e.preventDefault();
    try {
      await confirmSignUp(email, confirmationCode);
      logger.debug("Confirm Sign Up successful. Navigate to login");
      navigate("/login");
    } catch (error) {
      logger.error("Confirm SignUp failed: ", error);
    }
  };

  return (
    <div className="loginForm">
      <h2>Confirm Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            className="inputText"
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
            type="text"
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Confirmation Code"
            required
          />
        </div>
        <button type="submit">Confirm Account</button>
      </form>
    </div>
  );
};

export default ConfirmPage;
