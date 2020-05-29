import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { Value, Identifier, Type } from "./Value";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { IdentifierContext } from "../antlr/SpoodleParser";

export class IdentifierVisitor extends AbstractParseTreeVisitor<Identifier> implements SpoodleVisitor<Identifier> {

    protected defaultResult(): Identifier {
        return null;
    }

    visitIdentifier(ctx: IdentifierContext): Identifier {
        return new Identifier(
            ctx._prefix ? ctx._prefix.text : '',
            ctx.name().text
        );
    }
}