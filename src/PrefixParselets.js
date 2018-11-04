import Parselet from "./Parselet.js";
import { parseExpression } from "./Parser.js";

const prefixParselets = new Map;
const identifierPrefixParselets = new Map;

function matchSymbol (tokens, symbol) {
    const token = tokens.consume();

    if (token.type !== "symbol" || token.value !== symbol)
        throw new Error(`Expected "${symbol}"`);
}

function register (symbol, parselet) {
    prefixParselets.set(symbol, parselet);
}

function registerKeyword (word, parselet) {
    identifierPrefixParselets.set(word, parselet);
}

class PrefixOperatorParselet extends Parselet {
    parse (tokens) {
        const operator = tokens.consume();
        const expression = parseExpression(tokens, this.precedence);

        return {
            type: "prefix-operator",
            operator,
            expression
        };
    }
}

class AsyncParselet extends Parselet {
    parse (tokens) {
        const operator = tokens.consume();
        const expression = parseExpression(tokens, this.precedence);

        // TODO expression must be function or arrow function

        return {
            type: "async-operator",
            operator,
            expression
        };
    }
}

class NameParselet extends Parselet {
    parse (tokens) {
        const name = tokens.consume();

        return {
            type: "identifier",
            name
        };
    }
}

class FunctionParselet extends Parselet {
    // pipe back to common function parser?
}

class ClassParselet extends Parselet {
    // pipe back to common class parser?
}

class ImportParselet extends Parselet {
    // can be either import.meta or import(expression)
}

class GroupParselet extends Parselet {
    parse (tokens) {
        matchSymbol(tokens, "(");
        const expression = parseExpression(tokens, 0);
        matchSymbol(tokens, ")");

        return expression;
    }
}

register("!", new PrefixOperatorParselet);
register("+", new PrefixOperatorParselet);
register("-", new PrefixOperatorParselet);
register("++", new PrefixOperatorParselet);
register("--", new PrefixOperatorParselet);
register("~", new PrefixOperatorParselet);
register("...", new PrefixOperatorParselet);

register("identifier", new NameParselet);
register("(", new GroupParselet);
registerKeyword("async", new AsyncParselet);
registerKeyword("import", new ImportParselet);
registerKeyword("function", new FunctionParselet);
registerKeyword("class", new ClassParselet);

registerKeyword("new", new PrefixOperatorParselet);
registerKeyword("await", new PrefixOperatorParselet);
registerKeyword("typeof", new PrefixOperatorParselet);
registerKeyword("void", new PrefixOperatorParselet);
registerKeyword("delete", new PrefixOperatorParselet);

// maybe special behaviour for this on to also parse "yield*"
registerKeyword("yield", new PrefixOperatorParselet);

export { prefixParselets, identifierPrefixParselets };