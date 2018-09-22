import createCharacterStream from "./createCharacterStream.js";
import lexer from "./Lexer.js";

export default function parseJavaScript(str) {
    const characters = createCharacterStream(str);
    const tokens = lexer(characters);
    // TODO write parsing stage
    // const ast = Parser(tokens);

    return tokens; // iterator
}
