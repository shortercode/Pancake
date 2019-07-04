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

    const isNewline = token.isNewline;
    let parselet;

    if (token.type === "symbol")
        parselet = infixParselets.get(token.value);

    else if (token.type === "identifier") {
        parselet = identifierInfixParselets.get(token.value);
    }

    if (!parselet)
        parselet = infixParselets.get(token.type);

    if (parselet)
    {
        if (token.isNewline && parselet.allowLinebreak === false)
            return null;
        return parselet;
    }
    return null;
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