import assert = require("assert");
import SortedSet = require("collections/sorted-set");
import { Identifier } from "./Type";

export enum Op {
    PUSH,
    POP,
    JMP,
    JT,     // Jump true
    JF,     // Jump false
    GETLOCAL,
    SETLOCAL,
    GETGLOBAL,
    SETGLOBAL,
    CALL,

    ADD, SUB, MUL, DIV, MOD
}

export namespace Op {
    export function getOpFromString(o: string): Op {
        switch (o) {
            case '+': return Op.ADD;
            case '-': return Op.SUB;
            case '*': return Op.MUL;
            case '/': return Op.DIV;
            case '%': return Op.MOD;
            default:
                throw new Error("Unknown operator: " + o);
        }
    }
}

export class BytecodeChunk {

    public code: Buffer;
    public locals: SortedSet;
    public globals: Map<string, Global>;

    public ip: number; // Instruction pointer
    public sp: number; // Stack pointer
    public currentScope: number;

    public constructor() {
        this.code = Buffer.alloc(100, 0, "ascii");
        this.locals = new SortedSet([],
            (l: Local, r: Local): boolean => l.id.name == r.id.name && l.scope == r.scope,
            (l: Local, r: Local): number => {
                // Order as such: {a, 0} {b, 0} {c, 0} {a, 1} etc...
                if (l.scope < r.scope) return -1;
                else if (l.id.name == r.id.name) {
                    if (l.scope < r.scope) return -1;
                    else if (l.scope > r.scope) return 1;
                    return 0;
                }
                return 1;
            });
        this.globals = new Map<string, Global>();
        this.ip = 0;
        this.sp = 0;
        this.currentScope = 0;

        // Reserved keywords
        this.createGlobal({ prefix: '$', name: '$emit' });
        this.createGlobal({ prefix: '$', name: '$typeof' });
    }

    public emitBytes(...bytes: number[]): number {
        let written = 0;
        bytes.forEach(b => {
            this.code.writeUInt8(b, this.ip++);
            written++;
        });
        return written;
    }

    public emitDouble(val: number): number {
        this.code.writeDoubleLE(val, this.ip);
        this.ip += 8;
        return 8;
    }

    public emitInt16(val: number): number {
        this.code.writeInt16LE(val, this.ip);
        this.ip += 2;
        return 2;
    }

    public createLocal(id: Identifier) {
        this.locals.push({
            id: id, scope: this.currentScope, slot: this.sp++
        });
    }

    public getLocalSlot(id: Identifier): number {
        let node = this.locals.findGreatestLessThanOrEqual({
            id: id, scope: this.currentScope, slot: 0
        });
        if (!node || node.value.id.name != id.name)
            return -1;
        return node.value.slot;
    }

    public createGlobal(id: Identifier): number {
        if (this.globals.has(id.name))
            return this.globals.get(id.name).slot;
        let slot = this.globals.size + 1;
        this.globals.set(id.name, {
            slot: slot,
            isPaired: true
        });
        return slot;
    }

    public getGlobalSlot(id: Identifier): number {
        if (this.globals.has(id.name))
            return this.globals.get(id.name).slot;
        else
            return this.createGlobal(id);
    }

    public enterScope() {
        this.currentScope++;
    }

    public leaveScope(): number {
        let written = 0;
        this.currentScope--;
        assert(this.currentScope >= 0, `currentScope is below 0 (at ${this.currentScope})`);

        // Pop all locals that have left the scope
        while (this.locals.max() && this.locals.max().scope > this.currentScope) {
            this.locals.pop();
            this.sp--;
            written += this.emitBytes(Op.POP);
        }
        return written;
    }
}

interface Local {
    id: Identifier;
    scope: number;
    slot: number;
}

interface Global {
    slot: number;
    isPaired: boolean;
}