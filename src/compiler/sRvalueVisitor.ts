import * as Spoodle from "../antlr/SpoodleParser";

import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { Value, Type, Identifier } from "./Type";
import { IdentifierVisitor } from "./sIdentifierVisitor";
import { LiteralVisitor } from "./sLiteralVisitor";
import { BytecodeChunk, Op } from "./Bytecode";

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
        let id = new IdentifierVisitor().visit(ctx);
        let slot = this.bc.getLocalSlot(id);
        return slot >= 0
            ? this.bc.emitBytes(Op.GETLOCAL, slot)
            : this.bc.emitBytes(Op.GETGLOBAL, this.bc.getGlobalSlot(id));
    }

    public visitR_functioncall(ctx: Spoodle.R_functioncallContext): number {
        let written = 0;

        if (ctx.functionparams())
            written += this.visit(ctx.functionparams());

        if (ctx.identifier()) {
            written += this.visit(ctx.identifier());
        } else if (ctx.reservedKeyword()) {
            written += this.bc.emitBytes(Op.GETGLOBAL, this.bc.getGlobalSlot({
                prefix: '$', name: ctx.reservedKeyword().text
            }));
        }

        written += this.bc.emitBytes(Op.CALL);

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
        written += this.bc.emitBytes(Op.getOpFromString(ctx._op.text), 2);
        return written;
    }

    public visitAssignment(ctx: Spoodle.AssignmentContext): number {
        let written: number = 0;
        let id = new IdentifierVisitor().visit(ctx.identifier());
        let slot = this.bc.getLocalSlot(id);

        if (ctx.assign().binary()) {
            // x += rvalue becomes x = x + rvalue
            // take care of local vs. global
            written += slot >= 0
                ? this.bc.emitBytes(Op.GETLOCAL, slot)
                : this.bc.emitBytes(Op.GETGLOBAL, this.bc.getGlobalSlot(id));
            written += this.visit(ctx.rvalue());
            written += this.bc.emitBytes(Op.getOpFromString(ctx.assign().binary().text), 2);
        }
        else {
            written += this.visit(ctx.rvalue());
        }

        written += slot >= 0
            ? this.bc.emitBytes(Op.SETLOCAL, slot)
            : this.bc.emitBytes(Op.SETGLOBAL, this.bc.getGlobalSlot(id));

        return written;
    }
}