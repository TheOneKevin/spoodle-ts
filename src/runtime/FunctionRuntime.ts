import { Value } from "../common/Type";

export class FunctionRuntime {
    public f: (args: Value[]) => Value;
    public constructor(f: (args: Value[]) => Value) {
        this.f = f;
    }
}