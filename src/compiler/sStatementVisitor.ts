import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { BlockstatementContext, StatementContext, IfstatementContext, DeclarevarContext, ExprstatementContext, RvalueContext, ReturnstatementContext } from "../antlr/SpoodleParser";
import { BytecodeChunk } from "./Bytecode";
import { RvalueVisitor } from "./sRvalueVisitor";
import { Identifier, Type } from "../common/Type";
import { IdentifierVisitor } from "./sIdentifierVisitor";
import { Op } from "../common/Opcode";

export class StatementVisitor extends AbstractParseTreeVisitor<number>
    implements SpoodleVisitor<number> {

    public bc: BytecodeChunk;

    public constructor(bc: BytecodeChunk) {
        super();
        this.bc = bc;
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
        for (let s of ctx.statement()) {
            written += this.visit(s);
            if (s.returnstatement()) // Ignore everything after return.
                break;
        }
        written += this.bc.leaveScope();
        return written;
    }

    public visitIfstatement(ctx: IfstatementContext): number {
        let written: number = 0;
        written += this.visitRvalue(ctx.rvalue());
        written += this.bc.emitBytes(Op.JF);
        let jmpBack1 = this.bc.ip; // Backpatching
        written += this.bc.emitUInt16(69);

        // Emit the true block
        let off1 = this.visit(ctx._s1);

        // Emit the false block if it exists
        if (ctx._s2) {
            // Short circuit when return
            if (this.bc.code.readUInt8(this.bc.ip - 1) == Op.RETURN) {
                this.visit(ctx._s2);
            } else {
                // Jump past false after true
                off1 += this.bc.emitBytes(Op.JMP);
                let jmpBack2 = this.bc.ip;
                off1 += this.bc.emitUInt16(420);

                let off2 = this.visit(ctx._s2);
                this.bc.code.writeUInt16LE(off2, jmpBack2);
                written += off2;
            }
        }

        this.bc.code.writeUInt16LE(off1, jmpBack1);
        written += off1;
        return written;
    }

    public visitReturnstatement(ctx: ReturnstatementContext): number {
        let written: number = 0;
        written += this.visitRvalue(ctx.rvalue());
        written += this.bc.emitBytes(Op.RETURN);
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
