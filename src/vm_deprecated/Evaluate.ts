import { Rpn, Value, Operation, Type } from "./Value";
import { sFunction } from "./FunctionWrapper"

type Ops = Array<Rpn>;

export class ExecutionContext
{
    private funcs : Map<string, Function>;
    private vars : Map<string, Value>;

    public constructor()
    {
       this.vars = new Map()
    }

    public EvaluateFunction(f: string): Value
    {
        return null;
    }
}

export function EvaluateRpn(r: Ops): Value {
    let stack: Array<Value> = [];
    for (let i = 0; i < r.length; i++) {
        const e = r[i];
        if (e instanceof Value) {
            stack.push(e);
        }

        else if (e instanceof Operation) {
            let p = stack.splice(-e.n, e.n);
            stack.push(DoOperation(e, p));
        }
    }
    return stack.pop();
}

function DoOperation(op: Operation, p: Array<Value>): Value {
    switch (op.v) {
        case '+': return OpAdd(p[0], p[1]);
        case '-': return OpSub(p[0], p[1]);
        case '*': return OpMul(p[0], p[1]);
        case '/': return OpDiv(p[0], p[1]);
    }
    throw Error("Operator not implemented: " + op.v);
}

function OpAdd(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER) {
        let res: number = a.v + b.v;
        return new Value(res, Type.NUMBER);
    }
    throw Error("Add does not contain definition for: " + a.type.toString() + ", " + b.type.toString());
}

function OpSub(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER) {
        let res: number = a.v - b.v;
        return new Value(res, Type.NUMBER);
    }
    throw Error("Sub does not contain definition for: " + a.type.toString() + ", " + b.type.toString());
}

function OpMul(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER) {
        let res: number = a.v * b.v;
        return new Value(res, Type.NUMBER);
    }
    throw Error("Mul does not contain definition for: " + a.type.toString() + ", " + b.type.toString());
}

function OpDiv(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER) {
        let res: number = a.v / b.v;
        return new Value(res, Type.NUMBER);
    }
    throw Error("Div does not contain definition for: " + a.type.toString() + ", " + b.type.toString());
}
