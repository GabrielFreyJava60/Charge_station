import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { confirmSignUp, resendConfirmationCode } from "@/services/auth/authService";

import { getLogger } from "@/services/logging";

const logger = getLogger("ConfirmPage");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const trimmedEmail = email.trim();
  const canResendConfirmationCode = EMAIL_PATTERN.test(trimmedEmail);

  const handleSubmit = async (e: {preventDefault: () => void}) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await confirmSignUp(email, confirmationCode);
      logger.debug("Confirm Sign Up successful. Navigate to login");
      navigate("/login");
    } catch (error) {
      setErrorMessage(`Confirmation failed: ${(error as Error).message}`);
      logger.error("Confirm SignUp failed: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmationCode = async () => {
    if (!canResendConfirmationCode) {
      return;
    }

    try {
      setIsResending(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      await resendConfirmationCode(trimmedEmail);
      setSuccessMessage("Confirmation code resent. Please check your email.");
    } catch (error) {
      setErrorMessage(`Could not resend confirmation code: ${(error as Error).message}`);
      logger.error("Resend confirmation code failed: ", error);
    } finally {
      setIsResending(false);
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
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Confirming..." : "Confirm Account"}
        </button>
      </form>
      <button
        type="button"
        onClick={handleResendConfirmationCode}
        disabled={!canResendConfirmationCode || isResending}
      >
        {isResending ? "Resending..." : "Resend confirmation code"}
      </button>
      {errorMessage && <p>{errorMessage}</p>}
      {successMessage && <p>{successMessage}</p>}
    </div>
  );
};

export default ConfirmPage;
