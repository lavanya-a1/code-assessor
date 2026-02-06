import { LANGUAGE_MAP } from './CodeEditor';

function LanguageSelector({ value, onChange }) {
    return (
        <select
            className="language-select"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
        >
            {Object.entries(LANGUAGE_MAP).map(([id, { name }]) => (
                <option key={id} value={id}>
                    {name}
                </option>
            ))}
        </select>
    );
}

export default LanguageSelector;
