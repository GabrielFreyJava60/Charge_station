import { apiClient } from "@/services/api";
import { useCallback, useState } from "react";
import type { FC } from "react";
import { getLogger } from "@/services/logging";
import type { HealthResponse } from "@/types/responseTypes";

const logger = getLogger();

function getTime(): string {
  const now = new Date();
  return now.toTimeString();
}

interface HealthCheckerProps {
  defaultInfo: string,
  endpoint: string,
  checkerName?: string,
}

const HealthChecker: FC<HealthCheckerProps> = ({
  defaultInfo, endpoint, checkerName}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkInfo, setCheckInfo] = useState<string>(defaultInfo);
  
  const buttonCaption = `Check ${endpoint}`;

  const handleClick = useCallback(
    async () => {
      try {
        setIsLoading(true);
        const { code, status } = await apiClient.get<HealthResponse>(endpoint);
        setCheckInfo(`Successfully checked at ${getTime()}. Status="${status}", code="${code}"`);
      }
      catch (error) {
        logger.error("Health check failed", { endpoint, error });
        setCheckInfo(`Check failure at ${getTime()}`);
      }
      finally {
        setIsLoading(false);
      }
    }, [endpoint]
  );
  
  return (
    <div>
      <p>{checkerName ?? `Health checker for ${endpoint}`}</p>
      <button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading? "Requesting...": buttonCaption}
      </button>
      <p>{checkInfo}</p>
    </div>
  )
}

export default HealthChecker;