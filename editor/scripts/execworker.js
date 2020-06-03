window = {}
let log = console.log;
console.log = (t) => postMessage([0, 'log', t]);
console.info = (t) => postMessage([0, 'info', t]);
console.error = (t) => postMessage([0, 'error', t]);

importScripts('../dist/webworker.bundle.js');

let bytecode = null;
let ctx = null;
let errorFunc = (a, b, c) => postMessage([2, a, b, c]);
let update = () => {
    let stack = [];
    let globals = [];
    ctx.stack.forEach(x => {
        if (x.type == window.TypeEnum('NATIVE_FUNCTION'))
            stack.push({ v: '<NATIVE FUNCTION>', type: window.TypeEnum(x.type.toString()) })
        else
            stack.push({ v: x.v, type: window.TypeEnum(x.type.toString()) });
    });
    ctx.globals.forEach(x => {
        if(!x) globals.push(x);
        else if (x.type == window.TypeEnum('NATIVE_FUNCTION'))
            globals.push({ v: '<NATIVE FUNCTION>', type: window.TypeEnum(x.type.toString()) })
        else
            globals.push({ v: x.v, type: window.TypeEnum(x.type.toString()) });
    })
    postMessage([4, {
        ip: ctx.ip,
        bp: ctx.bp,
        fp: ctx.fptr,
        stack: stack,
        globals: globals,
        frames: ctx.callframe
    }]);
}

// Worker recieve code: 0 = compile, 1 = disassemble, 2 = execute, 3 = parse, 4 = reset, 5 = start debug, 6 = step one, 7 = stop debug
// Worker send code: 0 = console, 1 = disassembled, 2 = parse error, 3 = finish exec, 4 = update debug info
onmessage = e => {
    switch (e.data[0]) {
        case 0:
            bytecode = null;
            bytecode = window.CompileCode(e.data[1], errorFunc);
            break;
        case 1:
            postMessage([1, window.DisassembleCode(bytecode)]);
            break;
        case 2:
            console.info("Executing...");
            if (bytecode)
                window.ExecuteCode(bytecode);
            else
                console.error("No bytecode supplied.");
            postMessage([3])
            break;
        case 3:
            window.ParseCode(e.data[1], errorFunc);
            break;
        case 4:
            bytecode = null;
            break;
        case 5:
            ctx = null;
            console.info("Debugger attached.");
            if (bytecode) {
                ctx = window.PrepareExecutionEnvironment(bytecode);
                update();
            }
            else
                console.error("No bytecode supplied.");
            break;
        case 6:
            if (ctx) {
                window.StepOne(ctx);
                update();
            }
            else
                console.error("No debug session started.");
            break;
        case 7:
            ctx = null;
            console.info("Debugger detached.");
            break;
    }
}
