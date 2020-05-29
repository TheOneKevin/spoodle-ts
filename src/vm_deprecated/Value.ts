export enum Type {
    NUMBER,
    LONG,
    STRING,
    BOOLEAN,
    NULL,
    IDENTIFIER,
    FUNCTION
}

export namespace Type {
    /* export */ const LONG_MAX = 9223372036854775807n;
    /* export */ const LONG_MIN = -9223372036854775808n;
    export const isLong = (res: bigint | number) => LONG_MIN <= res && res <= LONG_MAX;
}

export class Rpn {
    // Dummy class
}

export class Identifier {
    public prefix: string;
    public name: string;

    public constructor(p: string, n: string) {
        this.prefix = p;
        this.name = n;
    }
}

export class Value extends Rpn {
    public v: any;
    public type: Type;

    public constructor(v: any, type: Type) {
        super();
        this.v = v;
        this.type = type;
    }

    isNumerical(): boolean {
        return this.type == Type.LONG || this.type == Type.NUMBER;
    }
}

export class Operation extends Rpn {
    public v: any;
    public n: number;

    public constructor(v: any, n: number) {
        super();
        this.v = v;
        this.n = n;
    }
}