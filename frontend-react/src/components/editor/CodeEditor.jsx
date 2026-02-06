import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
    71: { name: 'Python 3', monacoLang: 'python' },
    63: { name: 'JavaScript (Node.js)', monacoLang: 'javascript' },
    54: { name: 'C++ (GCC 9.2.0)', monacoLang: 'cpp' },
    62: { name: 'Java (OpenJDK 13.0.1)', monacoLang: 'java' },
    50: { name: 'C (GCC 9.2.0)', monacoLang: 'c' },
    60: { name: 'Go (1.13.5)', monacoLang: 'go' },
};

const DEFAULT_CODE = {
    71: '# Write your Python code here\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()\n',
    63: '// Write your JavaScript code here\n\nfunction solution() {\n    \n}\n\nsolution();\n',
    54: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your C++ code here\n    return 0;\n}\n',
    62: 'public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}\n',
    50: '#include <stdio.h>\n\nint main() {\n    // Write your C code here\n    return 0;\n}\n',
    60: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your Go code here\n    fmt.Println("Hello")\n}\n',
};

function CodeEditor({ languageId, code, onChange }) {
    const language = LANGUAGE_MAP[languageId]?.monacoLang || 'python';

    return (
        <div className="code-editor" style={{ height: '100%' }}>
            <Editor
                height="100%"
                language={language}
                value={code || DEFAULT_CODE[languageId] || ''}
                onChange={onChange}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 10 },
                }}
            />
        </div>
    );
}

export { LANGUAGE_MAP, DEFAULT_CODE };
export default CodeEditor;
