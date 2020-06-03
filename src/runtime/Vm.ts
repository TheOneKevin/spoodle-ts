import { Value, Type, Function } from "../common/Type";
import { Op } from "../common/Opcode";
import { Context } from "./Context";
import { FunctionRuntime } from "./FunctionRuntime";
import { decodeBinaryOperator, parseTruthy } from "./Operator";

function parseType(ctx: Context): Value {
    let tp = ctx.readByte();
    switch (tp) {
        case Type.NUMBER: {
            let val = ctx.readDouble();
            return new Value(val, tp);
        }
        case Type.FUNCTION: {
            let val = ctx.readByte();
            return new Value(val, tp);
        }
        case Type.NULL:
            return new Value(null, tp);
        default: throw new Error(`Invalid type ${tp}`);
    }
}

const MAX_GLOBALS_RESERVED = 1;

export function execute(main: Buffer, ftab: Function[]) {
    let ctx = new Context(main, ftab);
    prepareExecution(ctx);
    while (ctx.ip < ctx.buf.length) {
        stepOne(ctx);
    }
}

export function prepareExecution(ctx: Context) {
    ctx.globals[0] = null;
    ctx.globals[1] = new Value(
        new FunctionRuntime((args: Value[]) => {
            args.map(x => console.log(x.v));
            return new Value(null, Type.NULL);
        }), Type.NATIVE_FUNCTION);
    ctx.callframe.push({
        bp: 123, ip: 456, func: null, return: null
    });
}

export function stepOne(ctx: Context) {
    let op = ctx.readByte();
    switch (op) {
        case Op.PUSH: {
            ctx.push(parseType(ctx));
            break;
        }
        case Op.POP: {
            ctx.pop();
            break;
        }
        case Op.JMP:
        case Op.CJF:
        case Op.JT:
        case Op.JF: {
            let tgt = ctx.readUInt16();
            // Unconditional jump
            if (op == Op.JMP) {
                ctx.ip += tgt;
                break;
            }
            // Do we consume before jumping?
            let val = op == Op.CJF ? parseTruthy(ctx.pop()) : parseTruthy(ctx.top());
            if ((val && (op == Op.JT)) ||
                (!val && (op == Op.JF || op == Op.CJF)))
                ctx.ip += tgt;
            break;
        }
        case Op.GETLOCAL: {
            let pos = ctx.readByte() + ctx.bp;
            ctx.push(ctx.stack[pos]);
            break;
        }
        case Op.SETLOCAL: {
            let pos = ctx.readByte() + ctx.bp;
            ctx.stack[pos] = ctx.top();
            break;
        }
        case Op.GETGLOBAL: {
            let pos = ctx.readByte();
            if (ctx.globals[pos] == undefined || ctx.globals[pos] == null)
                throw new Error("Global not initialized. " + ctx.ip);
            ctx.push(ctx.globals[pos]);
            break;
        }
        case Op.SETGLOBAL: {
            let pos = ctx.readByte();
            if (pos > MAX_GLOBALS_RESERVED)
                ctx.globals[pos] = ctx.top();
            break;
        }
        case Op.CALL: {
            let arity = ctx.readByte();
            let func = ctx.stack[ctx.sp() - arity];
            if (func.type != Type.FUNCTION && func.type != Type.NATIVE_FUNCTION)
                throw new Error("Attempted to call non-function!");
            if (func.type == Type.FUNCTION) {
                ctx.callframe.push({
                    func: ctx.fptr,
                    ip: ctx.ip,
                    bp: ctx.bp,
                    return: null
                });
                ctx.bp = ctx.sp() - arity + 1; // Point to argument #1
                ctx.ip = 0;
                ctx.switchCode(func.v);
            }
            else {
                let args: Value[] = [];
                for (let i = 0; i < arity; i++)
                    args.push(ctx.pop());
                args = args.reverse();
                ctx.push((func.v as FunctionRuntime).f(args));
            }
            break;
        }
        case Op.RETURN: {
            if (ctx.callframe.length == 1) {
                console.log(`Program returned ${ctx.stack[ctx.sp()].v}`);
                return;
            }
            let top = ctx.callframe.pop();
            // "Push" return value
            ctx.stack[ctx.bp - 1] = ctx.stack[ctx.sp()];
            // Restore stack
            ctx.stack.splice(ctx.bp);
            ctx.bp = top.bp;
            // Jump
            ctx.ip = top.ip;
            ctx.switchCode(top.func);
            break;
        }

        default: {
            if (op >= Op.ADD && op <= Op.CGE) {
                ctx.push(decodeBinaryOperator(op, ctx.pop(), ctx.pop()));
                break;
            }
            throw new Error(`Invalid opcode: ${op}`);
        }
    } // End switch
}
