export default class TextBuffer {
    constructor(pageSize = 2048) {
        this._buffer = new Uint16Array(pageSize);
        this._size = pageSize;
        this._pageSize = pageSize
        this._index = 0;
        this._decoder = new TextDecoder("utf-16");

        // short length
        this._views = {
            single: this._buffer.subarray(0, 1),
            double: this._buffer.subarray(0, 2),
            triple: this._buffer.subarray(0, 3)
        };
    }
    _growBuffer() {
        // increase recorded buffer size
        this._size += this._pageSize;
        // create replacement
        const replacement = new Uint16Array(this._size);
        // copy old buffer into replacement
        replacement.set(this._buffer);
        // switch the buffers
        this._buffer = replacement;
    }
    push(ch) {
        const size = ch.length;

        // if we need more space, increase the buffer size
        if (this._index + size >= this._size)
            this._growBuffer();

        const pos = this._index;

        // copy the character codes to the buffer
        // don't use codePointAt here, we want char codes not code points
        for (let i = 0; i < size; i++)
            this._buffer[pos + i] = ch.charCodeAt(i);

        // increase the index position
        this._index += size;
    }
    consume() {
        if (this._index == 0)
            return "";

        let subview;

        switch (this._index) {
            case 1:
                subview = this._views.single;
                break;
            case 2:
                subview = this._views.double;
                break;
            case 3:
                subview = this._views.triple;
                break;
            default:
                subview = this._buffer.slice(0, this._index);
                break;
        }

        this._index = 0;
        return this._decoder.decode(subview);
    }
}
