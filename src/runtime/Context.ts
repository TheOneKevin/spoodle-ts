import { Value } from "../common/Type";
import { Frame } from "./Frame";

export class Context {
    public ip: number;
    public bp: number;
    public globals: Array<Value>;

    public stack: Array<Value>;
    public callframe: Array<Frame>;
    public buf: Buffer;

    public constructor(buf: Buffer) {
        this.ip = 0;
        this.bp = 0;
        this.globals = new Array<Value>();
        this.stack = new Array<Value>();
        this.callframe = new Array<Frame>();
        this.buf = buf;
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

    public switchCode(buf: Buffer) {
        this.buf = buf;
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