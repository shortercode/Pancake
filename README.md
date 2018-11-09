# Pancake
A simple parser for modern JS written in modern JS

# Status
This project is undergoing active development as of 8th Nov 2018. It is not complete or extensively tested yet, but you are welcome to use all or part of the existing code within your project. The lexer stage is considered complete; with support for template literals, regular expressions and optional semi-colons.

Work has been started on the parser, and it is capable of parsing some expressions and statements. It is very much incomplete at this time, operator precedence may be wrong. Some operators are only stubs, only a few statement types are supported. 

<!-- # Concepts -->

# Why?
Mostly as a learning exercise. Once it is complete I intend to use it as the basis for 2 other projects:
- a transpiler/compiler for a language of my own specification.
- a new JS minifier

# TODO
- increased test coverage ( seperate lexer verification )
- for in/of loops
- switch statements
- template literal parsing
- regex lexing edge case ( requires passing info to lexer from the parser, might not do this as it's quite obscure and totally useless )
- import/export
- html style comments ( again might not bother with this madness )
