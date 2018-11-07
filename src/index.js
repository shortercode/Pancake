import lexer from "./Lexer.js";
import createCharacterStream from "./createCharacterStream.js";
import { parseProgram } from "./Parser.js";

export function scan (str) {
    const characters = createCharacterStream(str);
    const tokens = lexer(characters);

    return tokens;
}

export function parse (str) {
    const characters = createCharacterStream(str);
    const tokens = lexer(characters);
    const ast = parseProgram(tokens);

    return ast;
}