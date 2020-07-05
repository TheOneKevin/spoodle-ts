import { Value, Type, Function } from "../common/Type";
import { Op } from "../common/Opcode";
import { Frame, NativeFunction } from "./FunctionRuntime";
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

export class VmBase {
    public ctx: Context;

    public constructor(ctx: Context) {
        this.ctx = ctx;
    }

    public stepOne() {
        let op = this.ctx.readByte();
        switch (op) {
            case Op.PUSH: {
                this.ctx.push(parseType(this.ctx));
                break;
            }
            case Op.POP: {
                this.ctx.pop();
                break;
            }
            case Op.JMP:
            case Op.CJF:
            case Op.JT:
            case Op.JF: {
                let tgt = this.ctx.readUInt16();
                // Unconditional jump
                if (op == Op.JMP) {
                    this.ctx.ip += tgt;
                    break;
                }
                // Do we consume before jumping?
                let val = op == Op.CJF ? parseTruthy(this.ctx.pop()) : parseTruthy(this.ctx.top());
                if ((val && (op == Op.JT)) ||
                    (!val && (op == Op.JF || op == Op.CJF)))
                    this.ctx.ip += tgt;
                break;
            }
            case Op.GETLOCAL: {
                let pos = this.ctx.readByte() + this.ctx.bp;
                this.ctx.push(this.ctx.stack[pos]);
                break;
            }
            case Op.SETLOCAL: {
                let pos = this.ctx.readByte() + this.ctx.bp;
                this.ctx.stack[pos] = this.ctx.top();
                break;
            }
            case Op.GETGLOBAL: {
                let pos = this.ctx.readByte();
                if (this.ctx.globals[pos] == undefined || this.ctx.globals[pos] == null)
                    throw new Error("Global not initialized. " + this.ctx.ip);
                this.ctx.push(this.ctx.globals[pos]);
                break;
            }
            case Op.SETGLOBAL: {
                let pos = this.ctx.readByte();
                if (pos > MAX_GLOBALS_RESERVED)
                    this.ctx.globals[pos] = this.ctx.top();
                break;
            }
            case Op.CALL: {
                let arity = this.ctx.readByte();
                let func = this.ctx.stack[this.ctx.sp() - arity];
                if (func.type != Type.FUNCTION && func.type != Type.NATIVE_FUNCTION)
                    throw new Error("Attempted to call non-function!");
                if (func.type == Type.FUNCTION) {
                    this.ctx.callframe.push({
                        func: this.ctx.fptr,
                        ip: this.ctx.ip,
                        bp: this.ctx.bp,
                        return: null
                    });
                    this.ctx.bp = this.ctx.sp() - arity + 1; // Point to argument #1
                    this.ctx.ip = 0;
                    this.ctx.switchCode(func.v);
                }
                else {
                    let args: Value[] = [];
                    for (let i = 0; i < arity; i++)
                        args.push(this.ctx.pop());
                    args = args.reverse();
                    this.ctx.push((func.v as NativeFunction).f(args));
                }
                break;
            }
            case Op.RETURN: {
                if (this.ctx.callframe.length == 1) {
                    console.log(`Program returned ${this.ctx.stack[this.ctx.sp()].v}`);
                    return;
                }
                let top = this.ctx.callframe.pop();
                // "Push" return value
                this.ctx.stack[this.ctx.bp - 1] = this.ctx.stack[this.ctx.sp()];
                // Restore stack
                this.ctx.stack.splice(this.ctx.bp);
                this.ctx.bp = top.bp;
                // Jump
                this.ctx.ip = top.ip;
                this.ctx.switchCode(top.func);
                break;
            }

            default: {
                if (op >= Op.ADD && op <= Op.CGE) {
                    this.ctx.push(decodeBinaryOperator(op, this.ctx.pop(), this.ctx.pop()));
                    break;
                }
                throw new Error(`Invalid opcode: ${op}`);
            }
        } // End switch
    } // End stepOne()
}

export class Vm extends VmBase {

    public constructor(main: Buffer, ftab: Function[]) {
        super(new Context(main, ftab));
        this.prepareExecution();
    }

    public prepareExecution() {
        this.ctx.globals[0] = null;
        this.ctx.globals[1] = new Value(
            new NativeFunction((args: Value[]) => {
                args.map(x => console.log(x.v));
                return new Value(null, Type.NULL);
            }), Type.NATIVE_FUNCTION);
        this.ctx.callframe.push({
            bp: 123, ip: 456, func: null, return: null
        });
    }

    public execute() {
        while (this.ctx.ip < this.ctx.buf.length)
            this.stepOne();
    }
}

export class Context {
    public ip: number;
    public bp: number;
    public globals: Array<Value>;

    public ftab: Function[];
    public fptr: number = 0;

    public stack: Array<Value>;
    public callframe: Array<Frame>;
    public buf: Buffer;

    public constructor(buf: Buffer, ftab: Function[]) {
        this.ip = 0;
        this.bp = 0;
        this.globals = new Array<Value>();
        this.stack = new Array<Value>();
        this.callframe = new Array<Frame>();

        // Main code
        this.ftab = ftab;
        this.ftab[0] = {
            code: buf,
            arity: 0
        };
        this.fptr = 0;

        this.buf = this.ftab[this.fptr].code;
    }

    public readByte(): number {
        return this.buf.readUInt8(this.ip++);
    }

    public readUInt16(): number {
        let res = this.buf.readUInt16LE(this.ip);
        this.ip += 2;
        return res;
    }

    public readDouble(): number {
        let res = this.buf.readDoubleLE(this.ip);
        this.ip += 8;
        return res;
    }

    public switchCode(id: number) {
        this.fptr = id;
        this.buf = this.ftab[this.fptr].code;
    }

    public pop(): Value {
        return this.stack.pop();
    }

    public push(v: Value) {
        this.stack.push(v);
    }

    public top(): Value {
        return this.stack[this.sp()];
    }

    public sp(): number {
        return this.stack.length - 1;
    }

    public currentframe(): Frame {
        return this.callframe[this.callframe.length - 1];
    }
}
