import { unexpectedToken, unexpectedEnd } from "./error.js";

export function getIdentifier (tokens) {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== "identifier")
        unexpectedToken(token, "identifier");
    
    return token.value;
}

export function notEnd (tokens) {
    if (tokens.done())
        unexpectedEnd();
}

export function match (tokens, value, type = "symbol") {
    if (tokens.done()) return false;
    const token = tokens.consume();

    if (token.type === type && token.value === value)
        return true;
    tokens.back();
    return false;
}

export function ensure (tokens, value, type = "symbol") {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== type || token.value !== value)
        unexpectedToken(token, value);
}