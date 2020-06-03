import { ANTLRInputStream, CommonTokenStream, ANTLRErrorListener, Token, ConsoleErrorListener } from 'antlr4ts';
import { SpoodleLexer } from '../src/antlr/SpoodleLexer';
import { SpoodleParser } from '../src/antlr/SpoodleParser';
import { BytecodeChunk } from '../src/compiler/Bytecode';
import { disassemble } from '../src/common/Debug';
import { StatementVisitor } from '../src/compiler/sStatementVisitor';
import { execute, prepareExecution, stepOne } from '../src/runtime/Vm';
import { Function, Type } from '../src/common/Type';
import { Context } from '../src/runtime/Context';

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
    let tokenStream = new CommonTokenStream(lexer);
    let parser = new SpoodleParser(tokenStream);
    parser.removeErrorListener(ConsoleErrorListener.INSTANCE);
    if (f) parser.addErrorListener(new ErrorListener(f));
    parser.program();
}

window.CompileCode = function (d: string, f: ErrorHandler): Compiled {
    let inputStream = new ANTLRInputStream(d);
    let lexer = new SpoodleLexer(inputStream);
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
        execute(c.code, c.funtab);
    } catch (err) {
        console.error(err);
    }
}

window.PrepareExecutionEnvironment = function(c: Compiled): Context {
    let ctx = new Context(c.code, c.funtab);
    prepareExecution(ctx);
    return ctx;
}

window.StepOne = function(ctx: Context) {
    stepOne(ctx)
}

window.TypeEnum = function(s: string) {
    return Type[s];
}
