import * as Spoodle from "../antlr/SpoodleParser";

import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { Value, Type } from "../common/Type";
import { LiteralVisitor } from "./sLiteralVisitor";
import { BytecodeChunk } from "./Bytecode";
import { Op } from "../common/Opcode";
import { StatementVisitor } from "./sStatementVisitor";

export class RvalueVisitor extends AbstractParseTreeVisitor<number>
    implements SpoodleVisitor<number> {

    private bc: BytecodeChunk;

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

    public visitR_rvalue(ctx: Spoodle.R_rvalueContext): number {
        return this.visitChildren(ctx);
    }

    public visitR_identifier(ctx: Spoodle.R_identifierContext): number {
        return this.visit(ctx.identifier());
    }

    public visitIdentifier(ctx: Spoodle.IdentifierContext): number {
        let id = ctx.text;
        let slot = this.bc.getLocalSlot(id);
        return slot >= 0
            ? this.bc.emitBytes(Op.GETLOCAL, slot)
            : this.bc.emitBytes(Op.GETGLOBAL, this.bc.getGlobalSlot(id));
    }

    public visitR_functioncall(ctx: Spoodle.R_functioncallContext): number {
        let written = 0;
        let nparams = 0;

        // Stack layout:
        // Bottom [ func, arg1, arg2, arg3, ... ] Top

        written += this.visit(ctx.rvalue());

        if (ctx.functionparams()) {
            written += this.visit(ctx.functionparams());
            nparams = ctx.functionparams().rvalue().length;
        }
        written += this.bc.emitBytes(Op.CALL, nparams);
        return written;
    }

    public visitFunctionparams(ctx: Spoodle.FunctionparamsContext): number {
        let written = 0;
        ctx.rvalue().map(x => written += this.visit(x));
        return written;
    }

    public visitR_literal(ctx: Spoodle.R_literalContext): number {
        let written: number = 0;
        let val: Value = new LiteralVisitor().visit(ctx.literal());
        switch (val.type) {
            case Type.NUMBER:
                written += this.bc.emitBytes(Op.PUSH, val.type);
                written += this.bc.emitDouble(val.v);
                break;
            default:
                throw new Error("Type not recognized! Id: " + val.type);
        }
        return written;
    }

    public visitExpression(ctx: Spoodle.ExpressionContext): number {
        let written: number = 0;
        written += this.visit(ctx._left);
        written += this.visit(ctx._right);
        written += this.bc.emitBytes(Op.getBinOpFromString(ctx._op.text));
        return written;
    }

    public visitLogicalexpr(ctx: Spoodle.LogicalexprContext): number {
        let written: number = 0;
        written += this.visit(ctx._left);
        // Short circuit (yeet if definite false/true)
        if (ctx._op.text == '&&')
            written += this.bc.emitBytes(Op.JF);
        else if (ctx._op.text == '||')
            written += this.bc.emitBytes(Op.JT);
        else
            throw new Error("Unknown operator " + ctx._op.text);
        // Simple backpatching for jumping over latter block
        let pos = this.bc.ip;
        written += this.bc.emitUInt16(123);
        // We pop the first operand off and allow the second operand to come on the stack
        // this way: 1 && 2 && 3 evaluates to 3
        let off = this.bc.emitBytes(Op.POP) + this.visit(ctx._right);
        this.bc.code.writeUInt16LE(off, pos);
        return written + off;
    }

    public visitAssignment(ctx: Spoodle.AssignmentContext): number {
        let written: number = 0;
        let id = ctx.identifier().text;
        let slot = this.bc.getLocalSlot(id);

        if (ctx.assign().binary()) {
            // x += rvalue becomes x = x + rvalue
            // take care of local vs. global
            written += slot >= 0
                ? this.bc.emitBytes(Op.GETLOCAL, slot)
                : this.bc.emitBytes(Op.GETGLOBAL, this.bc.getGlobalSlot(id));
            written += this.visit(ctx.rvalue());
            written += this.bc.emitBytes(Op.getBinOpFromString(ctx.assign().binary().text), 2);
        }
        else {
            written += this.visit(ctx.rvalue());
        }

        written += slot >= 0
            ? this.bc.emitBytes(Op.SETLOCAL, slot)
            : this.bc.emitBytes(Op.SETGLOBAL, this.bc.getGlobalSlot(id));

        return written;
    }

    public visitInlinefuncdecl(ctx: Spoodle.InlinefuncdeclContext): number {
        let written: number = 0;
        let body = this.bc.createChild();
        let arity = 0;

        // Enter scope so it's not global
        body.enterScope();
        if (ctx.functiontempl()) {
            // Stack layout:
            // (a, b, c, d) => bottom [ a, b, c, d ] top
            arity = ctx.functiontempl().identifier().length;
            ctx.functiontempl().identifier().map(x => body.createLocal(x.text));
        }
        new StatementVisitor(body).visit(ctx.blockstatement());

        // No return? Add one!
        if (body.code.readUInt8(body.ip - 1) != Op.RETURN)
            body.emitBytes(Op.PUSH, Type.NULL, Op.RETURN);

        let fid = this.bc.addFunction(arity, body);
        written += this.bc.emitBytes(Op.PUSH, Type.FUNCTION, fid);
        return written;
    }
}