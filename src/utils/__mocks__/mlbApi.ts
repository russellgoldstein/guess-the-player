
            export const mockPlayerData = {
                playerInfo: {
                    id: 545361,
                    fullName: "Mike Trout",
                    firstName: "Mike",
                    lastName: "Trout",
                    primaryNumber: "27",
                    currentTeam: { name: "Los Angeles Angels" },
                    primaryPosition: { abbreviation: "CF" },
                    birthDate: "1991-08-07",
                    birthCity: "Vineland",
                    birthStateProvince: "NJ",
                    birthCountry: "USA",
                    height: "6' 2\"",
                    weight: 235,
                    active: true,
                    imageUrl: "https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/545361/headshot/67/current"
                },
                hittingStats: [{
                    avg: ".296",
                    hr: 40,
                    rbi: 95,
                    obp: ".396",
                    slg: ".596",
                    ops: ".992",
                    sb: 11,
                    r: 82,
                    h: 124,
                    bb: 56,
                    so: 97
                }],
                pitchingStats: []
            };

            export const fetchPlayerData = async (playerId: number) => {
                return mockPlayerData;
            };

            export const searchPlayers = async (query: string) => {
                if (query.toLowerCase().includes('mike trout')) {
                    return [{
                        id: 545361,
                        fullName: "Mike Trout",
                        firstName: "Mike",
                        lastName: "Trout",
                        primaryNumber: "27",
                        currentTeam: { name: "Los Angeles Angels" },
                        primaryPosition: { abbreviation: "CF" }
                    }];
                }
                return [];
            };
        