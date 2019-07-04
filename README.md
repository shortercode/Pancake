# Pancake
A simple parser for modern JS written in modern JS

# Status
This project is undergoing semi-active development as of 4th July 2019. It is not complete or extensively tested yet, but you are welcome to use all or part of the existing code within your project. The lexer stage is considered complete; with support for template literals, regular expressions and optional semi-colons. If you have any questions related to the techniques involved, or wish to contribute in anyway please do not hesitate to open an issue and I will respond.

The majority of the parser is now complete, although there are a few statement types that are yet to be implemented. Most notably for in and for of, although the classic C style for loop is complete. Pattern parsing also requires some work going forward, at the moment it is a taking a "parse then verify" approach to patterns which may not be adequate. Any changes to pattern parsing may effect parsing of the for loop varients, as distinguising between them is rather complex. Output wise the parser is not producing a standardised AST. For ease of compatability it will likely be modified to generate the ESTree format in the future.

There's a few notable test cases which are failing due to regex lexing edge cases. This again is quite a complex situation, as the parser state typically signifies where a regex can appear but the lexer needs to aware before attempting to tokenise it. I'm intending to look further into the Sweet.js algorithm which potentially resolves the situation at the lexer level, and the existing symtem isn't far from it to begin with.

<!-- # Concepts -->

# Why?
Mostly as a learning exercise. Once it is complete I intend to use it as the basis for 2 other projects:
- a transpiler/compiler for a language of my own specification.
- a new JS minifier

# TODO
- increased test coverage ( seperate lexer verification )
- for in/of loops
- regex lexing edge case ( requires passing info to lexer from the parser, might not do this as it's quite obscure and totally useless )
- import/export
- html style comments ( again might not bother with this madness )
