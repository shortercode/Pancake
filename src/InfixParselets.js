import Parselet from "./Parselet.js";
import { parseExpression } from "./Parser.js";

const infixParselets = new Map;
const identifierInfixParselets = new Map;

function matchSymbol (tokens, symbol) {
    const token = tokens.consume();

    if (token.type !== "symbol" || token.value !== symbol)
        throw new Error(`Expected "${symbol}"`);
}

function register (symbol, parselet) {
    infixParselets.set(symbol, parselet);
}

function registerKeyword (word, parselet) {
    identifierInfixParselets.set(word, parselet);
}

class BinaryOperatorParselet extends Parselet {
    constructor (precedence, isRight = false) {
        super(precedence);
        this.isRight = isRight;
    }
    parse (tokens, left) {
        const operator = tokens.consume();
        const precedence = this.precedence - (this.isRight ? 1 : 0);
        const right = parseExpression(tokens, precedence);

        return {
            type: "expression-binary",
            operator,
            left,
            right
        };
    }
}

class PostfixOperatorParselet extends Parselet {
    parse (tokens, left) {
        const operator = tokens.consume();
        return {
            type: "expression-postfix",
            operator,
            expression: left
        };
    }
}

class AssignParselet extends Parselet {
    parse (tokens, left) {
        if (left.type != "expression-name")
            throw "HALP";

        matchSymbol(tokens, "=");
        const precedence = this.precedence - 1;
        const right = parseExpression(tokens, precedence);

        return {
            type: "expression-assignment",
            name: left.name,
            right
        };
    }
}

class ConditionalParselet extends Parselet {
    parse (tokens, left) {
        matchSymbol(tokens, "?");
        const thenArm = parseExpression(tokens, 0);
        matchSymbol(tokens, ":");
        const elseArm = parseExpression(tokens, this.precedence - 1);

        return {
            type: "expression-conditional",
            condition: left,
            then: thenArm,
            else: elseArm
        };
    }
}

class CallParselet extends Parselet {
    parse (tokens, left) {
        const args = [];
        matchSymbol(tokens, "(");

        if (tokens.peek().value !== ")") {
            do {
                args.push(parseExpression(tokens, 0));
            }
            while (tokens.peek().value === ",")
        }

        return {
            type: "expression-call",
            method: left,
            args
        };
    }
}

/*
    +
    -
    *
    /
    **

    =

    !
    ++
    --
*/

register("+", new BinaryOperatorParselet);
register("-", new BinaryOperatorParselet);
register("*", new BinaryOperatorParselet);
register("/", new BinaryOperatorParselet);
register("**", new BinaryOperatorParselet); // isRight

register("=", new AssignParselet);
register("(", new CallParselet);
register("?", new ConditionalParselet);

register("--", new PostfixOperatorParselet);
register("++", new PostfixOperatorParselet);

export { infixParselets, identifierInfixParselets };
