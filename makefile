DIST=./dist
NAME=pancake
SRC=./src/*
ENTRY=./src/index.js
OUT=$(DIST)/$(NAME)
 
.PHONY: clean all test fresh

all:
	rollup -i $(ENTRY) -o $(OUT).mjs -f es
	rollup -i $(ENTRY) -o $(OUT).js -f umd -n $(NAME)

test:
	node ./tests

clean:
	rm -f $(DIST)/*