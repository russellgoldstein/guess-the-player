import React from 'react';

interface ConfigurableHeaderProps {
    statKey: string;
    displayName: string;
    configurable: boolean;
    selected: string[];
    deselected: string[];
    onToggle: (key: string) => void;
}

export const ConfigurableHeader: React.FC<ConfigurableHeaderProps> = ({
    statKey,
    displayName,
    configurable,
    selected,
    deselected,
    onToggle,
}) => {
    const handleClick = () => {
        if (configurable) {
            onToggle(statKey);
        }
    };

    const isSelected = selected.includes(statKey);
    const isDeselected = deselected.includes(statKey);
    const isConfigurable = configurable && (isSelected || !isDeselected);

    return (
        <div
            className={`cursor-${configurable ? 'pointer' : 'default'} ${isConfigurable ? '' : 'opacity-50'
                }`}
            onClick={handleClick}
        >
            {displayName}
        </div>
    );
}; 