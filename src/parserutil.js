import { unexpectedToken, unexpectedEnd } from "./error.js";
import { parseExpression } from "./expressionParser.js";

function getIdentifier (tokens) {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== "identifier")
        unexpectedToken(token, "identifier");
    
    return token.value;
}

function notEnd (tokens) {
    if (tokens.done())
        unexpectedEnd();
}

function match (tokens, value, type = "symbol") {
    if (tokens.done()) return false;
    const token = tokens.consume();

    if (token.type === type && token.value === value)
        return true;
    tokens.back();
    return false;
}

function ensure (tokens, value, type = "symbol") {
    notEnd(tokens);
    const token = tokens.consume();
    if (token.type !== type || token.value !== value)
        unexpectedToken(token, value);
}

function parseParameters (tokens) {
    const list = [];

    ensure(tokens, "(");
    while (!tokens.done()) {
        if (match(tokens, ")"))
            break;
            
        const exp = parseExpression(tokens, 1);
        list.push(exp);

        if (match(tokens, ")"))
            break;

        if (!match(tokens, ","))
            unexpectedToken(tokens.peek(), ",");
    }

    return list;
}

export { notEnd, match, ensure, parseParameters, getIdentifier };