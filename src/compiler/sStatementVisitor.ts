import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { BlockstatementContext, StatementContext, IfstatementContext, DeclarevarContext, ExprstatementContext, RvalueContext } from "../antlr/SpoodleParser";
import { Op, BytecodeChunk } from "./Bytecode";
import { RvalueVisitor } from "./sRvalueVisitor";
import { Identifier, Type } from "./Type";
import { IdentifierVisitor } from "./sIdentifierVisitor";

export class StatementVisitor extends AbstractParseTreeVisitor<number>
    implements SpoodleVisitor<number> {

    public bc: BytecodeChunk;

    public constructor() {
        super();
        this.bc = new BytecodeChunk();
    }

    protected defaultResult(): number {
        return 0;
    }

    protected aggregateResult(result, child): number {
        return result + child;
    }

    public visitBlockstatement(ctx: BlockstatementContext): number {
        let written: number = 0;
        this.bc.enterScope();
        written += this.visitChildren(ctx);
        written += this.bc.leaveScope();
        return written;
    }

    public visitIfstatement(ctx: IfstatementContext): number {
        let written: number = 0;
        written += this.visitRvalue(ctx.rvalue());
        written += this.bc.emitBytes(Op.JF);
        let jmpBack = this.bc.ip; // Backpatching
        written += this.bc.emitInt16(69);
        // Note that jump offsets are measured from AFTER the jump instruction
        // Emit the true block
        let off = this.visit(ctx._s1);
        written += off;
        // Backpatch
        this.bc.code.writeInt16LE(off, jmpBack);
        // Emit the false block if it exists
        if (ctx._s2)
            written += this.visit(ctx._s2);
        return written;
    }

    public visitDeclarevar(ctx: DeclarevarContext): number {
        let written: number = 0;
        let id: Identifier = new IdentifierVisitor().visit(ctx.identifier());
        // It is very important that this executes before createLocal()
        // take this example: { let x = 1; { let x = x; } }
        // Should translate to: PUSH 0 1; GETLOCAL 0;
        if (ctx.rvalue())
            written += this.visitRvalue(ctx.rvalue());
        else
            written += this.bc.emitBytes(Op.PUSH, Type.NULL);

        if (this.bc.currentScope == 0) {
            // Global
            let slot = this.bc.createGlobal(id);
            written += this.bc.emitBytes(Op.SETGLOBAL, slot, Op.POP);
        }
        else {
            // Local
            this.bc.createLocal(id);
        }
        return written;
    }

    public visitExprstatement(ctx: ExprstatementContext): number {
        let written: number = 0;
        written += this.visitRvalue(ctx.rvalue());
        written += this.bc.emitBytes(Op.POP); // Conserve stack size
        return written;
    }

    public visitRvalue(ctx: RvalueContext): number {
        return new RvalueVisitor(this.bc).visit(ctx);
    }
}
