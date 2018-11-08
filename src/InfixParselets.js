import Parselet from "./Parselet.js";
import { parseExpression } from "./expressionParser.js";
import { match, ensure, parseParameters } from "./parserutil.js";

const infixParselets = new Map;
const identifierInfixParselets = new Map;

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
            type: "binary",
            operator,
            left,
            right
        };
    }
}

class PostfixOperatorParselet extends Parselet {
    parse (tokens, left) {
        return {
            type: "postfix",
            operator: tokens.consume(),
            expression: left
        };
    }
}

class ConditionalParselet extends Parselet {
    parse (tokens, left) {
        ensure(tokens, "?");
        const thenArm = parseExpression(tokens, 0);
        ensure(tokens, ":");
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
        const parameters = parseParameters(tokens);

        return {
            type: "call",
            method: left,
            parameters
        };
    }
}

class MemberParselet extends Parselet {
    parse(tokens, left) {
        ensure(tokens, ".");

        const right = parseExpression(tokens, this.precedence);

        return {
            type: "member",
            left,
            right
        };
    }
}

class ComputerMemberParselet extends Parselet {
    parse(tokens, left) {
        ensure(tokens, "[");

        const right = parseExpression(tokens, 0);

        ensure(tokens, "]");

        return {
            type: "computermember",
            left,
            right
        };
    }
}

register(",", new BinaryOperatorParselet(1));

// 2 - yield & yield* ( unary )

register("=", new BinaryOperatorParselet(3, true));
register("+=", new BinaryOperatorParselet(3, true));
register("-=", new BinaryOperatorParselet(3, true));
register("*=", new BinaryOperatorParselet(3, true));
register("/=", new BinaryOperatorParselet(3, true));
register("%=", new BinaryOperatorParselet(3, true));
register("**=", new BinaryOperatorParselet(3, true));
register("<<=", new BinaryOperatorParselet(3, true));
register(">>=", new BinaryOperatorParselet(3, true));
register(">>>=", new BinaryOperatorParselet(3, true));
register("&=", new BinaryOperatorParselet(3, true));
register("^=", new BinaryOperatorParselet(3, true));
register("|=", new BinaryOperatorParselet(3, true));

register("?", new ConditionalParselet(4));

register("||", new BinaryOperatorParselet(5));

register("&&", new BinaryOperatorParselet(6));

register("|", new BinaryOperatorParselet(7));

register("^", new BinaryOperatorParselet(8));

register("&", new BinaryOperatorParselet(9));

register("!==", new BinaryOperatorParselet(10));
register("!=", new BinaryOperatorParselet(10));
register("==", new BinaryOperatorParselet(10));
register("===", new BinaryOperatorParselet(10));

register("<", new BinaryOperatorParselet(11));
register("<=", new BinaryOperatorParselet(11));
register(">", new BinaryOperatorParselet(11));
register(">=", new BinaryOperatorParselet(11));
registerKeyword("in", new BinaryOperatorParselet(11));
registerKeyword("instanceof", new BinaryOperatorParselet(11));

register("<<", new BinaryOperatorParselet(12));
register(">>", new BinaryOperatorParselet(12));
register(">>>", new BinaryOperatorParselet(12));

register("+", new BinaryOperatorParselet(13));
register("-", new BinaryOperatorParselet(13));

register("*", new BinaryOperatorParselet(14));
register("/", new BinaryOperatorParselet(14));
register("%", new BinaryOperatorParselet(14));

register("**", new BinaryOperatorParselet(15, true));

// 16 - lots of unary

register("--", new PostfixOperatorParselet(17));
register("++", new PostfixOperatorParselet(17));

// 18 - new without argument list ( prefix )

register("(", new CallParselet(19));
register(".", new MemberParselet(19));
register("[", new ComputerMemberParselet(19));

// 19 -new with argument list ( prefix )
// 20 -Grouping ( prefix )


export { infixParselets, identifierInfixParselets };
