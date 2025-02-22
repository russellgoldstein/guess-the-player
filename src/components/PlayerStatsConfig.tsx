import React, { useState } from 'react';

interface Player {
    id: string;
    name: string;
}

interface PlayerStatsConfigProps {
    player: Player;
    onStatsChange: (stats: string[]) => void;
}

const PlayerStatsConfig: React.FC<PlayerStatsConfigProps> = ({ player, onStatsChange }) => {
    const [hiddenStats, setHiddenStats] = useState<string[]>([]);

    const stats = [
        'Home Runs',
        'Batting Average',
        'RBIs',
        'Stolen Bases',
        'Games Played',
    ];

    const toggleStat = (stat: string) => {
        setHiddenStats((prev) =>
            prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
        );
        onStatsChange(hiddenStats);
    };

    return (
        <div>
            <h3>Configure Stats for {player.name}</h3>
            <ul>
                {stats.map((stat) => (
                    <li key={stat}>
                        <label>
                            <input
                                type="checkbox"
                                checked={!hiddenStats.includes(stat)}
                                onChange={() => toggleStat(stat)}
                            />
                            {stat}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PlayerStatsConfig; 