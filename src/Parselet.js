export default class Parselet {
    constructor (precedence = 0) {
        this.precedence = precedence;
    }
    parse (tokens) {
        throw new Error("Not implemented");
    }
}