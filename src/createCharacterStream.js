const EOF = "";

export default function createCharacterStream (str) {
    let i = 0;
    const arr = Array.from(str);
    arr.push(EOF);
    const l = arr.length;

    let prev = [0, 0]
    let pos = [0, 0];

    return {
        next() {
            const ch = arr[i++];

            prev[0] = pos[0];
            prev[1] = pos[1];

            if (ch === "\n") {
                pos[0]++;
                pos[1] = 0;
            } else
                pos[1]++;

            return {
                value: ch,
                done: i > l
            }
        },
        position() {
            return pos.slice(0);
        },
        peek() {
            return arr[i];
        },
        peekNext() {
            return arr[i + 1];
        },
        back() {
            pos[0] = prev[0];
            pos[1] = prev[1];
            i = i <= 0 ? 0 : i - 1;
        },
        [Symbol.iterator]() {
            return this;
        }
    };
}
