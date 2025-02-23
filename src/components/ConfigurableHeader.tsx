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

    const getClassName = () => {
        if (!configurable) {
            return 'text-gray-700 cursor-default';
        }

        if (isSelected) {
            return 'text-green-600 cursor-pointer hover:text-green-700 transition-colors';
        }

        if (isDeselected) {
            return 'text-red-600 cursor-pointer hover:text-red-700 transition-colors';
        }

        return 'text-gray-700 cursor-pointer hover:text-gray-900 transition-colors';
    };

    return (
        <div className={getClassName()} onClick={handleClick}>
            {displayName}
        </div>
    );
}; 