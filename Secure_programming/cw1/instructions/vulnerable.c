#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>

int ConvArgc;
char **ConvArgv;

static int parse_cmd(void) {
    if (ConvArgc > 0) {
        char *to, *from, **av;
	size_t size, n;

	for (size = 0, av = ConvArgv + 1; *av; av++) {
	    size += strlen(*av) + 1;
	}
	char* user_args = malloc(size);
	for (to = user_args, av = ConvArgv + 1; (from = *av); av++) {
	    while (*from) {
	        if (from[0] == '\\' && !isspace((unsigned char)from[1])) {
	            from++;
                }
		*to++ = *from++;
            }
	    *to++ = ' ';
	}
	*--to = '\0';
	printf("%s\n", user_args);
    }
}

int main(int argc, char *argv[]) {
    if (argc > 0) {
        ConvArgc = argc;
	ConvArgv = reallocarray(NULL, ConvArgc + 1, sizeof(char *));
	
	ConvArgv = argv;

	parse_cmd();
    }
    return 0;
}

