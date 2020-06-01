import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { SpoodleLexer } from './antlr/SpoodleLexer';
import { SpoodleParser } from './antlr/SpoodleParser';
import { BytecodeChunk } from './compiler/Bytecode';
import { disassemble } from './common/Debug';
import { StatementVisitor } from './compiler/sStatementVisitor';
import { execute } from './runtime/Vm';

import { PerformanceObserver, performance } from 'perf_hooks';

var stdin = process.openStdin();

const obs = new PerformanceObserver(x => {
    console.log(x.getEntries()[0].name + " " + x.getEntries()[0].duration + "ms");
});
obs.observe({ entryTypes: ['measure'] });

stdin.addListener("data", function (d) {

    performance.mark('A');

    let inputStream = new ANTLRInputStream(d.toString());
    let lexer = new SpoodleLexer(inputStream);
    let tokenStream = new CommonTokenStream(lexer);
    let parser = new SpoodleParser(tokenStream);

    let tree = parser.program();
    if (parser.numberOfSyntaxErrors > 0)
        return;

    performance.mark('B');

    try {
        console.log("Parse Tree:");
        console.log(tree.toStringTree(parser));

        performance.mark('C');
        let bc = BytecodeChunk.createParent();
        let len = new StatementVisitor(bc).visit(tree);
        performance.mark('D');

        console.log("Bytecode length: " + len);
        console.log(bc.code);
        console.log("Disassembly:");
        console.log("main:");
        console.log(disassemble(bc.code, len));
        for(let i = 0; i < bc.funtab.length; i++) {
            console.log(`${i}:`);
            console.log(disassemble(bc.funtab[i].code, bc.funtab[i].code.length));
        }
        console.log("Executing...");

        let buf = Buffer.alloc(len, bc.code);
        
        performance.mark('E');
        execute(buf, bc.funtab);
        performance.mark('F');

        performance.measure('Lexing and AST', 'A', 'B');
        performance.measure('Compilation', 'C', 'D');
        performance.measure('Execution', 'E', 'F');
    }
    catch (err) {
        console.error(err);
    } finally {
        performance.clearMarks();
    }
});
