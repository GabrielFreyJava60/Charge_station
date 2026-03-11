import {useState, type FC} from 'react';
import { apiClient } from '@/services/api';
import { getLogger } from '@/services/logging';

const logger = getLogger('MeChecker');

interface MeData {
    "userId": string,
    "username": string,
    "email": string,
    "phone": string,
    "role": string,
    "status": string,
    "createdAt":string,
    "updatedAt": string,
}

const MeChecker: FC = () => {
    const [meData, setMeData] = useState<MeData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);


    const fetchMeData = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get<MeData>('/me');
            setMeData(data);
        } catch (error) {
            logger.error('Error fetching me data', error);
            setError((error as Error).message);
        }
        finally {
            setLoading(false);
        }
    };
    return (
        <>
            <button onClick={fetchMeData}>Fetch Me Data</button>
            {loading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            {meData && <div>Me Data: {JSON.stringify(meData)}</div>}
        </>
    );
};

export default MeChecker;
