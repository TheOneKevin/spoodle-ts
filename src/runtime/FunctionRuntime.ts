import { Value } from "../common/Type";

export class NativeFunction {
    public f: (args: Value[]) => Value;
    public constructor(f: (args: Value[]) => Value) {
        this.f = f;
    }
}

export interface Frame {
    func: number;
    ip: number;
    bp: number;
    return: Value;
}