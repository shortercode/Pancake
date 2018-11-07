import Parselet from "./Parselet.js";
import { parseExpression } from "./expressionParser.js";
import { match } from "./parserutil.js";

const infixParselets = new Map;
const identifierInfixParselets = new Map;

function register (symbol, parselet) {
    infixParselets.set(symbol, parselet);
}

// function registerKeyword (word, parselet) {
//     identifierInfixParselets.set(word, parselet);
// }

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
            type: "binary",
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
            type: "postfix",
            operator,
            expression: left
        };
    }
}

class AssignParselet extends Parselet {
    parse (tokens, left) {
        if (left.type != "identifier")
            throw "HALP";

        match(tokens, "=");
        const precedence = this.precedence - 1;
        const right = parseExpression(tokens, precedence);

        return {
            type: "assignment",
            name: left.value,
            right
        };
    }
}

class ConditionalParselet extends Parselet {
    parse (tokens, left) {
        match(tokens, "?");
        const thenArm = parseExpression(tokens, 0);
        match(tokens, ":");
        const elseArm = parseExpression(tokens, this.precedence - 1);

        return {
            type: "conditional",
            condition: left,
            then: thenArm,
            else: elseArm
        };
    }
}

class CallParselet extends Parselet {
    parse (tokens, left) {
        const args = [];
        match(tokens, "(");

        if (tokens.peek().value !== ")") {
            do {
                args.push(parseExpression(tokens, 0));
            }
            while (tokens.peek().value === ",")
        }
        
        match(tokens, ")");

        return {
            type: "call",
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

register("+", new BinaryOperatorParselet(13));
register("-", new BinaryOperatorParselet(13));
register("*", new BinaryOperatorParselet(14));
register("/", new BinaryOperatorParselet(14));
register("%", new BinaryOperatorParselet(14));
register(",", new BinaryOperatorParselet(1));
register("**", new BinaryOperatorParselet(15, true));

register("=", new AssignParselet(3));
register("(", new CallParselet(19));
register("?", new ConditionalParselet(4));

register("--", new PostfixOperatorParselet(17));
register("++", new PostfixOperatorParselet(17));

export { infixParselets, identifierInfixParselets };
