import { ANTLRInputStream, CommonTokenStream, ANTLRErrorListener, Token, ConsoleErrorListener } from 'antlr4ts';
import { SpoodleLexer } from '../src/antlr/SpoodleLexer';
import { SpoodleParser } from '../src/antlr/SpoodleParser';
import { BytecodeChunk } from '../src/compiler/Bytecode';
import { disassemble } from '../src/common/Debug';
import { StatementVisitor } from '../src/compiler/sStatementVisitor';
import { Vm } from '../src/runtime/Vm';
import { Function, Type } from '../src/common/Type';

interface Compiled {
    code: Buffer;
    funtab: Function[];
}

interface Disassembly {
    dis: string;
    map: string[];
}

declare global {
    interface Window {
        ParseCode: any;
        CompileCode: any;
        ExecuteCode: any;
        DisassembleCode: any;
        PrepareExecutionEnvironment: any;
        StepOne: any;
        TypeEnum: any;
    }
}

type ErrorHandler = (line: number, pos: number, msg: string) => void;
class ErrorListener implements ANTLRErrorListener<Token> {
    private f: ErrorHandler;
    public constructor(f: ErrorHandler) {
        this.f = f;
    }
    public syntaxError(recognizer, offendingSymbol, line, charPositionInLine, msg, e) {
        this.f(line, charPositionInLine, msg);
    }
}

window.ParseCode = function (d: string, f: ErrorHandler) {
    let inputStream = new ANTLRInputStream(d);
    let lexer = new SpoodleLexer(inputStream);
    lexer.removeErrorListener(ConsoleErrorListener.INSTANCE);
    if(f) lexer.addErrorListener(new ErrorListener(f));
    let tokenStream = new CommonTokenStream(lexer);
    let parser = new SpoodleParser(tokenStream);
    if (f) parser.addErrorListener(new ErrorListener(f));
    parser.removeErrorListener(ConsoleErrorListener.INSTANCE);
    parser.program();
}

window.CompileCode = function (d: string, f: ErrorHandler): Compiled {
    let inputStream = new ANTLRInputStream(d);
    let lexer = new SpoodleLexer(inputStream);
    if(f) lexer.addErrorListener(new ErrorListener(f));
    let tokenStream = new CommonTokenStream(lexer);
    let parser = new SpoodleParser(tokenStream);
    // Generate AST
    if (f) parser.addErrorListener(new ErrorListener(f));
    let tree = parser.program();
    if (parser.numberOfSyntaxErrors > 0) {
        return null;
    }
    // Generate bytecode
    try {
        let bc = BytecodeChunk.createParent();
        let len = new StatementVisitor(bc).visit(tree);
        return {
            code: Buffer.alloc(len, bc.code),
            funtab: bc.funtab
        };
    } catch (err) {
        console.error(err);
    }

    return null;
}

window.DisassembleCode = function (c: Compiled): Disassembly {
    if (!c) return null; // Null check!
    let dis: string = "";
    let line: number = 0;
    let map: string[] = [];

    // Closures and lambdas ftw!
    let pretty = (buf: Buffer, name: string | number, id: string | number) => {
        dis += `${name}:\n`;
        let arr: number[] = [];
        map[++line] = `${id}.xxxx`;
        disassemble(buf, buf.length, false, arr).split('\n').map((x, i) => {
            let last: string = `${id}.xxxx`;
            if (i < arr.length)
                last = `${id}.${arr[i].toString().padStart(4, '0')}`;
            map[++line] = last;
            dis += `\t${x}\n`;
        });
    };

    // First, disassemble main
    pretty(c.code, "main", "m");

    // Second, disassemble all functions
    c.funtab.forEach((f, i) => { if(f) pretty(f.code, i, i) });

    return {
        dis: dis,
        map: map
    };
}

window.ExecuteCode = function (c: Compiled) {
    try {
        new Vm(c.code, c.funtab).execute();
    } catch (err) {
        console.error(err);
    }
}

window.PrepareExecutionEnvironment = function(c: Compiled): Vm {
    let ctx = new Vm(c.code, c.funtab);
    ctx.prepareExecution();
    return ctx;
}

window.StepOne = function(ctx: Vm) {
    ctx.stepOne()
}

window.TypeEnum = function(s: string) {
    return Type[s];
}
