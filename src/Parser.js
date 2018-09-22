import BufferedIterator from "./BuffererIterator";

function parseExpression(tokens) {

}

function parseClass(tokens) {

}

function parseVariable(tokens) {

}

function parseFunction(tokens) {
    
}

const decParselets = new Map;

decParselets.set("var", parseVariable);
decParselets.set("let", parseVariable);
decParselets.set("const", parseVariable);
decParselets.set("class", parseClass);

function* parse (tokens) {
    for (const token of tokens) {
        const parselet = token.type === "identifier" && decParselets.get(token.value);

        if (!parselet) {
            tokens.back();
            yield parseExpression(tokens);
        }
        else
            yield parselet(token);
    }
}

export default function (tokens) {
    const itr = parse(tokens);
    return BufferedIterator(itr);
}