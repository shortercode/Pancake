# Pancake
A simple parser for modern JS written in modern JS

# Status
This project is undergoing active development as of 20th Sep 2018. It is not complete or extensively tested yet, but you are welcome to use all of part of the existing with within your project. Only the lexer stage is currently written, but it is able to scan regular expressions and template literals correctly ( which is one of the harder parts of reading JS ).

# Why?
Mostly as a learning exercise. Once it is complete I intend to use it as the basis for 2 projects:
- a transpiler/compiler for a language of my own specification.
- a new JS minifier

# TODO
- advanced number lexing e.g. ".1e-10", "0xEE"
- advanced identifier lexing e.g. "日本語 = []"
- initial parsing structure
