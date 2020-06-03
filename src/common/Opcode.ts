export enum Op {
    PUSH,
    POP,
    JMP,
    CJF,        // Consume and jump if false
    JT,         // Peek and jump if true
    JF,         // Peek and jump if false

    GETLOCAL,
    SETLOCAL,
    GETGLOBAL,
    SETGLOBAL,

    CALL,
    RETURN,

    // Order is important, don't mess up!
    ADD, SUB, MUL, DIV, MOD,      // + - * / %
    CEQ, CNE, CLT, CLE, CGT, CGE, // == != < <= > >=
}

export namespace Op {
    export function getBinOpFromString(o: string): Op {
        switch (o) {
            case '+': return Op.ADD;
            case '-': return Op.SUB;
            case '*': return Op.MUL;
            case '/': return Op.DIV;
            case '%': return Op.MOD;

            case '==': return Op.CEQ;
            case '<=': return Op.CLE;
            default:
                throw new Error("Unknown binary operator: " + o);
        }
    }
}