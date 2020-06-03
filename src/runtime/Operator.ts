import { Value, Type } from "../common/Type";
import { Op } from "../common/Opcode";

export function decodeBinaryOperator(op: number, a: Value, b: Value): Value {
    switch (op) {
        case Op.ADD: return add(a, b);
        case Op.SUB: return sub(a, b);
        case Op.CEQ: return ceq(a, b);
        case Op.CLE: return cle(a, b);
        default:
            throw new Error(`Unrecognized binary operator opcode: ${op}`);
    }
}

export function parseTruthy(val: Value): boolean {
    return !(
        (val.type == Type.NULL)
        || (val.type == Type.BOOLEAN && val.v == false)
        || (val.type == Type.NUMBER && val.v == 0)
        || (val.type == Type.STRING && val.v == "")
        || (val.v == null)
    );
}

function add(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER)
        return new Value(a.v + b.v, Type.NUMBER);
    throw new Error(`Cannot add ${Type[a.type.toString()]} and ${Type[b.type.toString()]}`);
}

function sub(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER)
        return new Value(b.v - a.v, Type.NUMBER);
    throw new Error(`Cannot add ${Type[a.type.toString()]} and ${Type[b.type.toString()]}`);
}

function ceq(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER)
        return new Value(a.v == b.v, Type.BOOLEAN);
    throw new Error(`Cannot compare ${Type[a.type.toString()]} and ${Type[b.type.toString()]}`);
}

function cle(a: Value, b: Value): Value {
    if (a.type == Type.NUMBER && b.type == Type.NUMBER)
        return new Value(b.v <= a.v, Type.BOOLEAN);
    throw new Error(`Cannot compare ${Type[a.type.toString()]} and ${Type[b.type.toString()]}`);
}
