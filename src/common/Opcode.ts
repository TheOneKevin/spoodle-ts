export enum Op {
    PUSH,
    POP,
    JMP,
    JF,         // Jump false
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
    export function getOpFromString(o: string): Op {
        switch (o) {
            case '+': return Op.ADD;
            case '-': return Op.SUB;
            case '*': return Op.MUL;
            case '/': return Op.DIV;
            case '%': return Op.MOD;

            case '==': return Op.CEQ;
            case '<=': return Op.CLE;
            default:
                throw new Error("Unknown operator: " + o);
        }
    }
}