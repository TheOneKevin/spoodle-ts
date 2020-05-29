import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { sFunction } from "./FunctionWrapper";
import { ProgramVisitor } from "./sProgramVisitor";
import { InlinefuncdeclContext, FunctiontemplContext, BlockstatementContext } from "../antlr/SpoodleParser";
import { IdentifierVisitor } from "./sIdentifierVisitor";

export class FunctionVisitor extends AbstractParseTreeVisitor<sFunction> implements SpoodleVisitor<sFunction> {
    private func : sFunction;

    public constructor() {
        super();
        this.func = new sFunction([], "", null);
    }

    protected defaultResult(): sFunction {
        return null;
    }

    protected aggregateResult(result, childResult): sFunction {
        if(childResult != null) return childResult;
        else return result;
    }

    visitInlinefuncdecl(ctx: InlinefuncdeclContext): sFunction {
        this.visitChildren(ctx);
        return this.func;
    }

    visitFunctiontempl(ctx: FunctiontemplContext): sFunction {
        this.func.parameters = [].concat(
            ctx.identifier().map(x => new IdentifierVisitor().visit(x))
        );
        return null;
    }

    visitBlockstatement(ctx: BlockstatementContext): sFunction {
        let visitor = new ProgramVisitor();
        this.func.script = visitor.visitChildren(ctx);
        this.func.statements = visitor.statements;
        // Yeah baby!!
        return null;
    }
}