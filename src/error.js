export function notImplemented () {
    throw new Error("not implemented");
}

export function unexpectedToken (token, expected) {
    if (expected)
        throw new Error(`Expected "${expected}" @ "${token.position}"`);
    else
        throw new Error(`Unexpected token "${token.value}" @ "${token.position}"`);
}

export function unexpectedEnd () {
    throw new Error("Unexpected end of input");
}