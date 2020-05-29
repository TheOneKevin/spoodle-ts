import * as Spoodle from '../antlr/SpoodleParser';
import { SpoodleVisitor } from '../antlr/SpoodleVisitor'
import { AbstractParseTreeVisitor } from 'antlr4ts/tree/AbstractParseTreeVisitor'
import { Type, Value, Operation, Rpn } from './Value';
import { FunctionVisitor } from './sFunctionVisitor';
import { IdentifierVisitor } from './sIdentifierVisitor';
import { LiteralVisitor } from './sLiteralVisitor';

type Ops = Array<Rpn>;

// Recursively build an expression in postfix notation
// a = 1 + 2*3 becomes [ a, 1, 2, 3, *, +, = ]

export class ExpressionVisitor extends AbstractParseTreeVisitor<Ops> implements SpoodleVisitor<Ops> {
    
    protected defaultResult(): Ops {
        return [];
    }

    protected aggregateResult(result, childResult): Ops {
        return [].concat(result, childResult);
    }

    visitExprstatement(ctx: Spoodle.ExprstatementContext): Ops {
        return this.visitChildren(ctx);
    }

    visitExpression(ctx: Spoodle.ExpressionContext): Ops {
        return [].concat(
            this.visit(ctx._left),
            this.visit(ctx._right),
            new Operation(ctx._op.text, 2)
        );
    }

    visitAssignment(ctx: Spoodle.AssignmentContext): Ops {
        return [].concat(
            this.visit(ctx.identifier()),
            this.visit(ctx.rvalue()),
            new Operation('=', 2)
        );
    }

    visitDeclarevar(ctx: Spoodle.DeclarevarContext): Ops {
        let val = ctx.rvalue();
        return [].concat(
            this.visit(ctx.identifier()),
            val ? this.visit(val) : new Value(null, Type.NULL),
            new Operation('let', 2)
        );
    }

    visitTernery(ctx: Spoodle.TerneryContext): Ops {
        return [].concat(
            this.visit(ctx._a),
            this.visit(ctx._b),
            this.visit(ctx._c),
            new Operation('?', 3)
        );
    }

    visitPrefixoperation(ctx: Spoodle.PrefixoperationContext): Ops {
        return [].concat(
            this.visit(ctx._right),
            new Operation(ctx._op.text + 'p', 1)
        );
    }

    visitPostfixoperation(ctx: Spoodle.PostfixoperationContext): Ops {
        return [].concat(
            this.visit(ctx._left),
            new Operation(ctx._op.text, 1)
        );
    }

    visitR_functioncall(ctx: Spoodle.R_functioncallContext): Ops {
        let r = [].concat(this.visit(ctx.identifier()));
        let p = ctx.functionparams();
        if (p) r = r.concat(this.visit(p));
        return r.concat(new Operation('()', r.length));
    }

    visitFunctionparams(ctx: Spoodle.FunctionparamsContext): Ops {
        let r = [].concat(this.visit(ctx._a));
        let p = ctx._b;
        if (p) r = r.concat(this.visit(p));
        return r;
    }

    visitInlinefuncdecl(ctx: Spoodle.InlinefuncdeclContext): Ops {
        return [
            new Value(new FunctionVisitor().visit(ctx), Type.FUNCTION)
        ];
    }

    visitIdentifier(ctx: Spoodle.IdentifierContext): Ops {
        return [ 
            new Value(new IdentifierVisitor().visit(ctx), Type.IDENTIFIER)
        ];
    }

    visitReturnstatement(ctx: Spoodle.ReturnstatementContext): Ops {
        return [
            this.visit(ctx.rvalue()),
            new Operation('r', 1)
        ];
    }

    visitR_literal(ctx: Spoodle.R_literalContext): Ops {
        return this.visitChildren(ctx);
    }

    visitLiteral(ctx: Spoodle.LiteralContext): Ops {
        let v = new LiteralVisitor().visit(ctx);
        return [v]
    }
}