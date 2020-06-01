import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { SpoodleLexer } from './antlr/SpoodleLexer';
import { SpoodleParser } from './antlr/SpoodleParser';
import { BytecodeChunk } from './compiler/Bytecode';
import { disassemble } from './common/Debug';
import { StatementVisitor } from './compiler/sStatementVisitor';
import { execute } from './runtime/Vm';

let d = `
    let $fib = function($n, $a, $b) {
        if($n == 1) return $a;
        if($n == 2) return $b;
        return $fib($n-1, $b, $a+$b);
    };
    return $fib(76, 0, 1);`;

let inputStream = new ANTLRInputStream(d.toString());
let lexer = new SpoodleLexer(inputStream);
let tokenStream = new CommonTokenStream(lexer);
let parser = new SpoodleParser(tokenStream);

let tree = parser.program();

try {
    console.log("Parse Tree:");
    console.log(tree.toStringTree(parser));

    let bc = BytecodeChunk.createParent();
    let len = new StatementVisitor(bc).visit(tree);

    console.log("Bytecode length: " + len);
    console.log(bc.code);
    console.log("Disassembly:");
    console.log("main:");
    console.log(disassemble(bc.code, len));
    for (let i = 0; i < bc.funtab.length; i++) {
        console.log(`${i}:`);
        console.log(disassemble(bc.funtab[i].code, bc.funtab[i].code.length));
    }
    console.log("Executing...");

    let buf = Buffer.alloc(len, bc.code);

    execute(buf, bc.funtab);
}
catch (err) {
    console.error(err);
}
