# Pancake
A simple parser for modern JS written in modern JS

# Status
This project is undergoing active development as of 7th Nov 2018. It is not complete or extensively tested yet, but you are welcome to use all or part of the existing code within your project. The lexer stage is considered complete; with support for template literals, regular expressions and optional semi-colons.

Work has been started on the parser, and it is capable of parsing some expressions and statements. It is very much incomplete at this time, operator precedence may be wrong. Some operators are only stubs, only a few statement types are supported. 

<!-- # Concepts -->

# Why?
Mostly as a learning exercise. Once it is complete I intend to use it as the basis for 2 other projects:
- a transpiler/compiler for a language of my own specification.
- a new JS minifier

# TODO
- advanced number lexing e.g. ".1e-10", "0xEE"
- most of the statement types
- still a lot of parselets
- increased test coverage ( seperate lexer verification )