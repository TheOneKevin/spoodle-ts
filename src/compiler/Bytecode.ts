import assert = require("assert");
import SortedSet = require("collections/sorted-set");
import { Function } from "../common/Type";
import { Op } from "../common/Opcode";

const BUF_SIZE = 128;

export class BytecodeChunk {

    public code: Buffer;
    public ip: number; // Instruction pointer
    public currentScope: number;

    private sp: number; // Stack pointer
    public locals: SortedSet;

    private globals: Map<string, Global>;
    public funtab: Array<Function>;
    public strtab: Array<string>;

    private parent: BytecodeChunk = null;

    private constructor() {
        this.code = Buffer.alloc(BUF_SIZE, 0, "ascii");
        this.locals = new SortedSet([],
            (l: Local, r: Local): boolean => l.name == r.name && l.scope == r.scope,
            (l: Local, r: Local): number => {
                // Order as such: {a, 0} {b, 0} {c, 0} {a, 1} etc...
                if (l.name < r.name) return -1;
                else if (l.name == r.name) {
                    if (l.scope < r.scope) return -1;
                    else if (l.scope > r.scope) return 1;
                    return 0;
                }
                return 1;
            });

        this.ip = 0;
        this.sp = 0;
        this.currentScope = 0;
    }

    public static createParent(): BytecodeChunk {
        let res = new BytecodeChunk();
        res.parent = null;
        res.globals = new Map<string, Global>();
        
        res.funtab = new Array<Function>();
        res.funtab.push(null); // Reserve 0th slot for main

        res.strtab = new Array<string>();
        // Reserved keywords
        res.createGlobal('$emit');
        res.createGlobal('$typeof');
        return res;
    }

    public createChild(): BytecodeChunk {
        let res = new BytecodeChunk();
        res.parent = this;
        return res;
    }

    public emitBytes(...bytes: number[]): number {
        let written = 0;
        bytes.forEach(b => {
            this.code.writeUInt8(b, this.inc());
            written++;
        });
        return written;
    }

    public emitDouble(val: number): number {
        this.code.writeDoubleLE(val, this.inc(8));
        return 8;
    }

    public emitUInt16(val: number): number {
        this.code.writeUInt16LE(val, this.inc(2));
        return 2;
    }

    private inc(v: number = 1): number {
        let res = this.ip;
        this.ip += v;
        if (this.ip > this.code.length)
            this.code = Buffer.alloc(BUF_SIZE * 2, this.code);
        return res;
    }

    public createLocal(id: string) {
        this.locals.push({
            name: id, scope: this.currentScope, slot: this.sp++
        });
    }

    public getLocalSlot(id: string): number {
        let node = this.locals.findGreatestLessThanOrEqual({
            name: id, scope: this.currentScope, slot: 0
        });
        if (!node || node.value.name != id)
            return -1;
        return node.value.slot;
    }

    public createGlobal(id: string): number {
        if (this.parent)
            return this.parent.createGlobal(id);

        if (this.globals.has(id))
            return this.globals.get(id).slot;
        let slot = this.globals.size + 1;
        this.globals.set(id, {
            slot: slot,
            isPaired: true
        });
        return slot;
    }

    public getGlobalSlot(id: string): number {
        if (this.parent)
            return this.parent.getGlobalSlot(id);

        if (this.globals.has(id))
            return this.globals.get(id).slot;
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

    public addFunction(arity: number, bc: BytecodeChunk): number {
        if (this.parent)
            return this.parent.addFunction(arity, bc);
        this.funtab.push({
            arity: arity,
            code: Buffer.alloc(bc.ip, bc.code)
        });
        return this.funtab.length - 1;
    }
}

interface Local {
    name: string;
    scope: number;
    slot: number;
}

interface Global {
    slot: number;
    isPaired: boolean;
}
