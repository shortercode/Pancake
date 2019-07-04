export default class Parselet {
    constructor (precedence = 0) {
        this.precedence = precedence;
        this.allowLinebreak = true;
    }
    parse (tokens) {
        throw new Error("Not implemented");
    }
}