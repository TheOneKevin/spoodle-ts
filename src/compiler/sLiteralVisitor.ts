import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { Value, Type } from "../common/Type";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { LiteralContext } from "../antlr/SpoodleParser";

export class LiteralVisitor extends AbstractParseTreeVisitor<Value>
    implements SpoodleVisitor<Value> {

    protected defaultResult(): Value {
        return null;
    }

    protected aggregateResult(result, childResult): Value {

        // When presented with 2 possible options:
        // - return the non-null one
        // - if both are non-null, return the child

        if (childResult != null) return childResult;
        else return result;
    }

    public visitLiteral(ctx: LiteralContext): Value {
        if (ctx.Numeric_literal())
            return parseInteger(ctx.Numeric_literal().toString());
        if(ctx.Boolean_literal())
            return parseBoolean(ctx.Boolean_literal().toString());
        else if (ctx.String_literal())
            return parseString(ctx.String_literal().toString());
        throw Error("Literal not implemented (this is really bad).");
    }
}

function parseString(input: string): Value {
    return new Value(input.substring(1, input.length - 1), Type.STRING);
}

function parseBoolean(input: string): Value {
    switch(input) {
        case 'true': return new Value(true, Type.BOOLEAN);
        case 'false': return new Value(false, Type.BOOLEAN);
        default: throw new Error("Cannot parse boolean value (this is really bad): " + input);
    }
}

function parseInteger(input: string): Value {

    // Step 1: Parse number and suffix

    let _num = input;
    let id = input[input.length - 1].toLowerCase();
    if ("bsl".indexOf(id) > -1) {
        _num = _num.substr(0, _num.length - 1);
    }

    // Step 2: Convert to numerical

    if (id == 'l') {
        // Step 2.1: If its a long, use BigInt
        let res = BigInt(_num);
        if (Type.isLong(res))
            return new Value(res, Type.LONG);
        else
            throw new Error("Long value too big!");
    }

    // Step 2.2: Otherwise, call it a number
    return new Value(Number(_num), Type.NUMBER);
}