export type WelcomeStationDto = {
    id: string;
    name: string;
    city: string;
    address: string;
    providerName: string;
    maxPowerKw: number;
    portCount: number;
};

export type WelcomeResponse = {
    code: number;
    data: WelcomeStationDto[];
};

export class WelcomeService {
    async list(params: { city?: string; provider?: string }): Promise<WelcomeResponse> {
        const stations: WelcomeStationDto[] = [
            {
                id: 'st-001',
                name: 'Azrieli Fast Charge',
                city: 'Tel Aviv',
                address: '132 Begin Rd',
                providerName: 'EV Power',
                maxPowerKw: 150,
                portCount: 4,
            },
            {
                id: 'st-002',
                name: 'Haifa Port Station',
                city: 'Haifa',
                address: '21 Independence Ave',
                providerName: 'ChargeIL',
                maxPowerKw: 120,
                portCount: 3,
            },
        ];

        const filtered = stations.filter((station) => {
            const byCity = params.city
                ? station.city.toLowerCase().includes(params.city.toLowerCase())
                : true;

            const byProvider = params.provider
                ? station.providerName.toLowerCase().includes(params.provider.toLowerCase())
                : true;

            return byCity && byProvider;
        });

        return {
            code: 200,
            data: filtered,
        };
    }
}