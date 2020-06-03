require.config({ paths: { 'vs': '../node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], () => {
    window.eCode = monaco.editor.create(document.getElementById('container-codeview'), {
        value: [
            'let $fib = function($n, $a, $b) {',
            '\tif($n == 1) return $a;',
            '\tif($n == 2) return $b;',
            '\treturn $fib($n-1, $b, $a+$b);',
            '};',
            '$emit($fib(10, 1, 1));',
            'return 0;'
        ].join('\n'),
        language: 'spoodle',
        automaticLayout: true,
        contextmenu: false,
    });
    eCode.decorations = [];

    window.eDisasm = monaco.editor.create(document.getElementById('container-disasmview'), {
        value: [
            ''
        ].join('\n'),
        language: 'sasm',
        automaticLayout: true,
        contextmenu: false,
        readOnly: true,
        lineNumbersMinChars: 8
    });
    eDisasm.decorations = [];

    window.monaco = monaco;

    myLayout.on('stateChanged', () => {
        eCode.layout();
        eDisasm.layout();
    });

    eCode.onDidChangeModelContent(e => {
        eCode.markers = [];
        worker.postMessage([ 3, eCode.getValue() ]);
        monaco.editor.setModelMarkers(eCode.getModel(), 'errors', eCode.markers);
    });
});