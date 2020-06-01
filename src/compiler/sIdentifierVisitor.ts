import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { Identifier } from "../common/Type";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { IdentifierContext } from "../antlr/SpoodleParser";

export class IdentifierVisitor extends AbstractParseTreeVisitor<Identifier>
    implements SpoodleVisitor<Identifier> {

    protected defaultResult(): Identifier {
        return null;
    }

    public visitIdentifier(ctx: IdentifierContext): Identifier {
        return {
            prefix: ctx._prefix ? ctx._prefix.text : '',
            name: ctx.text
        };
    }
}