import { Value } from "../common/Type";

export interface Frame {
    func: Buffer;
    ip: number;
    bp: number;
    return: Value;
}