export class sJit {
    private buf: Buffer;
    private ip: number;
    private code: string;

    public constructor(buf: Buffer) {
        this.buf = buf;
        this.ip = 0;
        this.code = "";
    }

    public compile() {
        
    }
}