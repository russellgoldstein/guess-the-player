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
    onToggle
}) => {
    const getHeaderClassName = () => {
        if (!configurable) return '';

        if (selected.includes(statKey)) {
            return 'text-green-500 cursor-pointer';
        }
        if (deselected.includes(statKey)) {
            return 'text-red-500 cursor-pointer';
        }
        return '';
    };

    return (
        <th
            className={getHeaderClassName()}
            onClick={() => configurable && onToggle(statKey)}
        >
            {displayName}
        </th>
    );
}; 