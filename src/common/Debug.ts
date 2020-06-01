import { Op } from "./Opcode";
import { Type } from "./Type";

export function disassemble(buf: Buffer, len: number): string {
    let ip: number = 0;
    let returnString = '';
    while (ip < len) {
        returnString += ip.toString().padStart(4, '0') + ': ';
        let op = buf.readUInt8(ip++);
        returnString += Op[op.toString()] + ' ';
        switch (op) {
            case Op.PUSH: {
                let type = buf.readUInt8(ip++);
                returnString += type + ' ';
                switch (type) {
                    case Type.NUMBER: {
                        let val = buf.readDoubleLE(ip);
                        ip += 8;
                        returnString += val;
                        break;
                    }
                    case Type.FUNCTION: {
                        let val = buf.readUInt8(ip++);
                        returnString += val;
                        break;
                    }
                }
                break;
            }

            case Op.JF:
            case Op.JMP: {
                let off = buf.readUInt16LE(ip);
                ip += 2;
                returnString += off;
                break;
            }

            case Op.SETLOCAL:
            case Op.GETLOCAL:
            case Op.SETGLOBAL:
            case Op.GETGLOBAL:
            case Op.CALL:
                returnString += buf.readUInt8(ip++);
                break;

            // Do operations
            /*case Op.ADD: case Op.SUB: case Op.MUL: case Op.DIV: case Op.MOD:
            case Op.CEQ: case Op.CNE: case Op.CLT: case Op.CLE: case Op.CGT: case Op.CGE: {
                let num = buf.readUInt8(ip++);
                returnString += num;
                break;
            }*/
        }

        returnString += '\n';
    }

    return returnString;
}
