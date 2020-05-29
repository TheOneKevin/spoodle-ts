import { Rpn, Identifier } from "./Value";

type Ops = Array<Rpn>;

export class sFunction {
    public parameters : Array<Identifier>;
    public statements : Map<number, Ops>;
    public script     : string;

    public constructor(params: Array<Identifier>, sc: string, st: Map<number, Ops>)
    {
        this.parameters = params;
        this.script = sc;
        this.statements = st;
    }
}