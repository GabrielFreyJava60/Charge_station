import type { StationDto, StationStatus } from './stations.types';
import { env } from '../../config/env';
import { AwsLambdaInvoker, type LambdaInvoker } from '../../utils/lambdaInvoker';
import { createLogger } from '../../utils/logger';



export interface StationsService {
  list(callerId: string): Promise<StationDto[]>;
  getById(stationId: string, callerId: string): Promise<StationDto | null>;
  create(payload: Omit<StationDto, 'stationId' | 'status'>, callerId: string): Promise<StationDto>;
  updateStatus(
    stationId: string,
    status: StationStatus,
    callerId: string,
    callerGroups: string[]
  ): Promise<StationDto>;
}

const logger = createLogger('stations.service');
const LAMBDA_INVOKER: LambdaInvoker = new AwsLambdaInvoker(env.awsRegion);

// In future production this should call Python Lambdas which read from DynamoDB.
export class MockStationsService implements StationsService {
  private readonly stations: StationDto[] = [
    {
      stationId: 'st-001',
      name: 'Station 1',
      status: 'READY',
      lat: 50.12,
      lng: 30.45,
      ports: 4,
      freePorts: 2
    },
    {
      stationId: 'st-002',
      name: 'Station 2',
      status: 'IN_USE',
      lat: 50.13,
      lng: 30.46,
      ports: 2,
      freePorts: 0
    }
  ];

  async list(_callerId: string): Promise<StationDto[]> {
    return this.stations;
  }

  async getById(stationId: string, _callerId: string): Promise<StationDto | null> {
    return this.stations.find((s) => s.stationId === stationId) ?? null;
  }

  async create(payload: Omit<StationDto, 'stationId' | 'status'>, _callerId: string): Promise<StationDto> {
    const station: StationDto = {
      stationId: `st-${String(this.stations.length + 1).padStart(3, '0')}`,
      status: 'READY',
      ...payload
    };
    this.stations.push(station);
    return station;
  }

  async updateStatus(
    stationId: string,
    status: StationStatus,
    _callerId: string,
    _callerGroups: string[]
  ): Promise<StationDto> {
    const station = this.stations.find((s) => s.stationId === stationId);
    if (!station) {
      throw new Error('Station not found');
    }
    station.status = status;
    return station;
  }
}

export class LambdaStationsService implements StationsService {
  async list(callerId: string): Promise<StationDto[]> {
    logger.debug('Invoking stations lambda: list', { callerId });
    const result = await LAMBDA_INVOKER.invokeJson<StationDto[]>(env.stationsLambdaFunctionName, {
      action: 'list_stations',
      caller_id: callerId
    });
    return result;
  }

  async getById(stationId: string, callerId: string): Promise<StationDto | null> {
    logger.debug('Invoking stations lambda: getById', { stationId, callerId });
    const result = await LAMBDA_INVOKER.invokeJson<StationDto | null>(env.stationsLambdaFunctionName, {
      action: 'get_station_by_id',
      stationId,
      caller_id: callerId
    });
    return result;
  }

  async create(payload: Omit<StationDto, 'stationId' | 'status'>, callerId: string): Promise<StationDto> {
    logger.debug('Invoking stations lambda: create', { payload, callerId });
    const result = await LAMBDA_INVOKER.invokeJson<StationDto>(env.stationsLambdaFunctionName, {
      action: 'create_station',
      caller_id: callerId,
      payload
    });
    return result;
  }

  async updateStatus(
    stationId: string,
    status: StationStatus,
    callerId: string,
    callerGroups: string[]
  ): Promise<StationDto> {
    logger.debug('Invoking stations lambda: updateStatus', {
      stationId,
      status,
      callerId,
      callerGroups
    });
    const result = await LAMBDA_INVOKER.invokeJson<StationDto>(env.stationsLambdaFunctionName, {
      action: 'update_station_status',
      stationId,
      status,
      caller_id: callerId,
      caller_groups: callerGroups
    });
    return result;
  }
}

export function buildStationsService(): StationsService {
  // Для локальной разработки используем мок, для реальных окружений — Lambda
  if (env.environment === 'local') {
    return new MockStationsService();
  }

  return new LambdaStationsService();
}
