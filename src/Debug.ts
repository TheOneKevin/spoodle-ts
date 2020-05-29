import { Op } from "./compiler/Bytecode";
import { Type } from "./compiler/Type";

let mnemonic: Map<Op, string> = new Map();
mnemonic[Op.PUSH] = "PUSH";
mnemonic[Op.POP] = "POP";
mnemonic[Op.JMP] = "JMP";
mnemonic[Op.JT] = "JT";
mnemonic[Op.JF] = "JF";

mnemonic[Op.GETLOCAL] = "GETLOCAL";
mnemonic[Op.SETLOCAL] = "SETLOCAL";
mnemonic[Op.GETGLOBAL] = "GETGLOBAL";
mnemonic[Op.SETGLOBAL] = "SETGLOBAL";

mnemonic[Op.CALL] = "CALL";

mnemonic[Op.ADD] = "ADD";
mnemonic[Op.SUB] = "SUB";
mnemonic[Op.MUL] = "MUL";
mnemonic[Op.DIV] = "DIV";
mnemonic[Op.MOD] = "MOD";

export function disassemble(buf: Buffer, len: number): string {
    let ip: number = 0;
    let returnString = '';
    while (ip < len) {
        let op = buf.readUInt8(ip++);
        returnString += ip.toString().padStart(4, '0') + ': ';
        returnString += mnemonic[op] + ' ';
        switch (op) {
            case Op.PUSH:
                let type = buf.readUInt8(ip++);
                returnString += type + ' ';
                switch (type) {
                    case Type.NUMBER:
                        let val = buf.readDoubleLE(ip);
                        ip += 8;
                        returnString += val;
                        break;
                }
                break;

            case Op.JT:
            case Op.JF:
            case Op.JMP:
                let off = buf.readInt16LE(ip);
                ip += 2;
                returnString += off;
                break;

            case Op.SETLOCAL:
            case Op.GETLOCAL:
                returnString += buf.readUInt8(ip++);
                break;

            case Op.SETGLOBAL:
            case Op.GETGLOBAL:
                returnString += buf.readUInt8(ip++);
                break;

            // Do operations
            case Op.ADD:
            case Op.SUB:
            case Op.MUL:
            case Op.DIV:
            case Op.MOD:
                let num = buf.readUInt8(ip++);
                returnString += num;
                break;
        }

        returnString += '\n';
    }

    return returnString;
}
