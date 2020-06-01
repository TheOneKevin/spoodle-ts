import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { SpoodleVisitor } from "../antlr/SpoodleVisitor";
import { BytecodeChunk } from "./Bytecode";
import { ProgramContext } from "../antlr/SpoodleParser";

export class ProgramVisitor extends AbstractParseTreeVisitor<number>
    implements SpoodleVisitor<number> {

    protected defaultResult(): number {
        return null;
    }

    protected aggregateResult(result, child): number {
        return null;
    }

    public visitProgram(ctx: ProgramContext): number {
        return 0;
    }
}