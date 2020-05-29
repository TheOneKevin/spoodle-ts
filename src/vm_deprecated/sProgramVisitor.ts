import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { Rpn } from "./Value";
import { ExprstatementContext, ExpressionContext, ReturnstatementContext, DeclarevarContext, BlockstatementContext } from "../antlr/SpoodleParser";
import { ExpressionVisitor } from "./sExpressionVisitor";

type Ops = Array<Rpn>;

export class ProgramVisitor extends AbstractParseTreeVisitor<string> implements SpoodleVisitor<string> {
    private globalState = 0;
    public  statements: Map<number, Ops>;

    public constructor() {
        super();
        this.statements = new Map();
    }

    protected defaultResult() {
        return "";
    }

    protected aggregateResult(result, childResult): string {
        return result + childResult;
    }

    visitBlockstatement(ctx: BlockstatementContext): string {
        return null;
    }

    visitReturnstatement(ctx: ReturnstatementContext): string {
        let ops = new ExpressionVisitor().visit(ctx);
        return null;
    }

    visitDeclarevar(ctx: DeclarevarContext): string {
        let ops = new ExpressionVisitor().visit(ctx);
        return null;
    }
    
    visitExprstatement(ctx: ExprstatementContext): string {
        let ops = new ExpressionVisitor().visit(ctx);
        return null;
    }


}