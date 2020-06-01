// All things related to RPN (suffix notation)

export enum Type {
    NUMBER,
    LONG,
    STRING,
    BOOLEAN,
    NULL,
    FUNCTION, NATIVE_FUNCTION // Shhh... It's a secret!
}

export namespace Type {
    /* export */ const LONG_MAX = 9223372036854775807n;
    /* export */ const LONG_MIN = -9223372036854775808n;
    export const isLong = (res: bigint | number) => LONG_MIN <= res && res <= LONG_MAX;
}

export interface Identifier {
    prefix: string;
    name: string;
}

export class Value {
    public v: any;
    public type: Type;

    public constructor(v: any, type: Type) {
        this.v = v;
        this.type = type;
    }

    isNumerical(): boolean {
        return this.type == Type.LONG || this.type == Type.NUMBER;
    }
}

export interface Function {
    arity: number;
    code: Buffer;
}
