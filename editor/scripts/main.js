var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

// Safety first, children!
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}

// I think it's about time I abused lambdas
let consoleFactory = (i) =>
    (t) => {
        let text = $(`<span class='${i}'>${escapeHtml(t)}</span><br />`);
        $('#consoleview').append(text).animate({ scrollTop: $('#consoleview').prop("scrollHeight") }, 100);
    }
// Override console
console.info = consoleFactory('info');
console.log = consoleFactory('log');
console.error = consoleFactory('error');

// Execution thread
let worker;
$(document).ready(respawn);

let primeButtons = () => {
    $('.execdisable').prop('disabled', true);
    $('.execute').addClass('is-loading');
}

let unprimeButtons = () => {
    $('.execdisable').prop('disabled', false);
    $('.execute').removeClass('is-loading');
}

let disasm = null;
function respawn() {
    if (worker) {
        console.log("Killed worker.");
        worker.terminate();
        unprimeButtons();
    }
    worker = new Worker("./scripts/execworker.js");
    worker.onmessage = e => {
        switch (e.data[0]) {
            case 0: {
                consoleFactory(e.data[1])(e.data[2]);
                break;
            }
            case 1: {
                disasm = e.data[1];
                if (disasm && disasm.dis) {
                    console.info("Compilation successful.");
                    eDisasm.setValue(disasm.dis.trim());
                    eDisasm.updateOptions({
                        lineNumbers: (n) => {
                            if (n < disasm.map.length)
                                return disasm.map[n];
                            return n;
                        }
                    });
                }
                else
                    console.log("Compilation finished with errors.");
                break;
            }
            case 2: {
                eCode.markers.push({
                    startLineNumber: e.data[1],
                    startColumn: e.data[2],
                    endLineNumber: e.data[1],
                    endColumn: eCode.getModel().getLineLength(e.data[1]) + 1,
                    message: e.data[3],
                    severity: monaco.MarkerSeverity.Error
                });
                monaco.editor.setModelMarkers(eCode.getModel(), 'errors', eCode.markers);
                break;
            }
            case 3: {
                unprimeButtons();
                break;
            }
            case 4: {
                if (!disasm) console.error("Debugger failed to update state (bytecode disassembly not found).");
                
                $('#debugview .table').html($(`
				<tr><td>ip</td><td><input class="input is-small" value="${e.data[1].ip}" readonly /></td></tr>
                <tr><td>sp</td><td><input class="input is-small" value="${Math.max(e.data[1].stack.length - 1, 0)}" readonly /></td></tr>
                <tr><td>bp</td><td><input class="input is-small" value="${e.data[1].bp}" readonly /></td></tr>
				<tr><td>frame</td><td><input class="input is-small" value="${e.data[1].fp}" readonly /></td></tr>
			    `));
                $('#debugview').html($('#debugview').html());

                let f = e.data[1].fp == 0 ? 'm' : e.data[1].fp;
                let str = `${f}.${e.data[1].ip.toString().padStart(4, '0')}`;
                let l = disasm.map.findIndex(x => x == str);
                eDisasm.decorations = eDisasm.deltaDecorations(eDisasm.decorations, [{
                    range: new monaco.Range(l, 1, l, 1),
                    options: {
                        isWholeLine: true,
                        className: 'debugContent',
                        glyphMarginClassName: 'debugGlyphMargin'
                    }
                }]);

                $('#stackview .table').html('');
                e.data[1].stack.forEach((x, i) => {
                    let row = $(`<tr><td>${i}:</td><td>${x.type}</td><td><input class="input is-small" value="${x.v}" readonly /></td></tr>`);
                    if (i == e.data[1].bp)
                        row.addClass('highlighted');
                    $('#stackview .table').append(row);
                });
                $('#stackview').html($('#stackview').html());
                $('#stackview').animate({ scrollTop: $('#stackview').prop("scrollHeight") }, 100)

                $('#globalview .table').html('');
                e.data[1].globals.forEach((x, i) => {
                    if (x)
                        $('#globalview .table').append($(`<tr><td>${i}:</td><td>${x.type}</td><td><input class="input is-small" value="${x.v}" readonly /></td></tr>`));
                    else
                        $('#globalview .table').append($(`<tr><td>${i}:</td><td>??</td><td><input class="input is-small" value="uninitialized" readonly /></td></tr>`));
                });
                $('#globalview').html($('#globalview').html());
                $('#globalview').animate({ scrollTop: $('#globalview').prop("scrollHeight") }, 100)

                $('#callview .table').html('');
                e.data[1].frames.forEach((x, i) =>
                    $('#callview .table').append($(`<tr><td>${i}:</td><td>${x.func}</td><td>${x.ip}</td><td>${x.bp}</td></tr>`))
                );
                $('#callview').html($('#callview').html());
                $('#callview').animate({ scrollTop: $('#callview').prop("scrollHeight") }, 100)

                break;
            }
        } // End switch
    }
}
