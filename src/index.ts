import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
import { SpoodleLexer } from './antlr/SpoodleLexer';
import { SpoodleParser } from './antlr/SpoodleParser';
import { BytecodeChunk } from './compiler/Bytecode';
import { disassemble } from './debug';
import { StatementVisitor } from './compiler/sStatementVisitor';

var stdin = process.openStdin();
stdin.addListener("data", function (d) {

    //let d = ` { let x; x = 1; } `;

    let inputStream = new ANTLRInputStream(d.toString());
    let lexer = new SpoodleLexer(inputStream);
    let tokenStream = new CommonTokenStream(lexer);
    let parser = new SpoodleParser(tokenStream);

    let tree = parser.program();
    if (parser.numberOfSyntaxErrors > 0)
        return;

    try {
        console.log("Parse Tree:");
        console.log(tree.toStringTree(parser));
        let code = new StatementVisitor();
        let len = code.visit(tree);
        console.log("Bytecode length: " + len);
        console.log(code.bc.code);
        console.log("Disassembly:");
        console.log(disassemble(code.bc.code, len));
    }
    catch (err) {
        console.error(err);
    }
});
