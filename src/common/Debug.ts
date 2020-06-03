import { Op } from "./Opcode";
import { Type } from "./Type";

export function disassemble(buf: Buffer, len: number, line: boolean = true, mapping?: number[]): string {
    let ip: number = 0;
    let returnString = '';
    while (ip < len) {
        if (line)
            returnString += ip.toString().padStart(4, '0') + ': ';
        if (mapping)
            mapping.push(ip);

        let op = buf.readUInt8(ip++);
        returnString += Op[op.toString()] + ' ';
        switch (op) {
            case Op.PUSH: {
                let type = buf.readUInt8(ip++);
                returnString += Type[type.toString()] + ' ';
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
            case Op.JT:
            case Op.CJF:
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
        }

        returnString += '\n';
    }

    return returnString;
}
