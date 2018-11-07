import { prefixParselets, identifierPrefixParselets } from "./PrefixParselets.js";
import { infixParselets, identifierInfixParselets } from "./InfixParselets.js";
import { unexpectedToken, unexpectedEnd } from "./error.js";

function getPrecedence(tokens) {
    const parser = getInfix(tokens);
    return parser ? parser.precedence : 0;
}

function getInfix(tokens) {
    const token = tokens.peek();
    if (!token)
        return null;

    if (token.type === "symbol")
        return infixParselets.get(token.value);

    if (token.type === "identifier") {
        const parselet = identifierInfixParselets.get(token.value);
        if (parselet)
            return parselet;
    }

    return infixParselets.get(token.type);
}

function getPrefix(tokens) {
    const token = tokens.peek();
    if (!token)
        unexpectedEnd();

    if (token.type === "symbol")
        return prefixParselets.get(token.value);

    if (token.type === "identifier") {
        const parselet = identifierPrefixParselets.get(token.value);
        if (parselet)
            return parselet;
    }

    return prefixParselets.get(token.type);
}

export function parseExpression (tokens, precedence) {
    let parser = getPrefix(tokens);

    if (!parser)
        unexpectedToken(tokens.peek());

    let left = parser.parse(tokens);

    while (precedence < getPrecedence(tokens)) {
        parser = getInfix(tokens);
        left = parser.parse(tokens, left);
    }

    return left;
}