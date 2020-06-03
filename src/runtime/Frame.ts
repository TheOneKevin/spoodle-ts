import { Value } from "../common/Type";

export interface Frame {
    func: number;
    ip: number;
    bp: number;
    return: Value;
}