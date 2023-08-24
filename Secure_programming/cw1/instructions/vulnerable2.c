#include <sys/types.h>
#include <errno.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <ctype.h>

#define MUL_NO_OVERFLOW ((size_t)1 << (sizeof(size_t) * 4))


/* Reallocarray is an OpenBSD function that implements realloc for arrays with nice error handling. 
 * Here's the definition just copied & pasted
 */
void * reallocarray(void *optr, size_t nmemb, size_t size) {
	if ((nmemb >= MUL_NO_OVERFLOW || size >= MUL_NO_OVERFLOW) &&
			nmemb > 0 && SIZE_MAX / nmemb < size) {
		errno = ENOMEM;
		return NULL;
	}
	return realloc(optr, size * nmemb);
}

// Custom Matrix Structure
typedef struct SavedMatrix {
	int Height;
	int Width;
	int* Array;
} SavedMatrix;

//Tuple Structure for holding Matrix Widths and Heights before initialising Array
typedef struct Tuple {
	int fst;
	int snd;
} Tuple;


// Just a simple PrettyPrint function
void prettyPrint(SavedMatrix* sa) {
	int i;
	for (i=0; i < (sa->Width * sa->Height); ++i) {
		if ((i % sa->Width) == 0) {
			printf("\n");
		}
		printf("%d\t", sa->Array[i]);
	}
	printf("\n");
}


// Generate an array with (reasonably) random elements between 1 and 256
int* randomArray(int* arr, int width, int height) {
	int i;
	for (i=0; i <(width * height); i++) {
		arr[i] = 1 + (rand() % 256);
	}
	return arr;
}

void generateArrayList(struct Tuple* tuples, size_t len, struct SavedMatrix* arrays) {
	int tup = 0;
	int64_t ArraySize;
	void* tmpArrayPtr;
	SavedMatrix *sa = malloc(1100 * sizeof(int)); // Just malloc a reasonable size to begin with, can realloc later.
	int MAX_WIDTH = tuples[0].fst;
	int MAX_HEIGHT = tuples[0].snd;
	do {
		sa->Width = tuples[tup].fst;
		sa->Height = tuples[tup].snd;
		if (sa->Width < 0 || sa->Height < 0) {
			printf("The Width and/or Height of Arrays must be positive!\n");
			return;
		}
		if ((sa->Width > MAX_WIDTH ) || (sa->Height > MAX_HEIGHT)) {
			printf("First Array Must Be Largest!\n");
			return;
		}
		ArraySize = sa-> Width * sa->Height;
		if (ArraySize > 1000) {
			printf("Arrays are limited to 1000 elements!\n");
			return;
		}
		tmpArrayPtr = reallocarray(sa->Array, ArraySize, sizeof(int));
		if (tmpArrayPtr == NULL) { // reallocarray returns NULL if something goes wrong
			tup++;
			continue;
		}
		sa->Array = tmpArrayPtr;
		sa->Array = randomArray(sa->Array, sa->Width, sa->Height);
		arrays[tup] = *sa;
		prettyPrint(sa);
		tup++;
	}
	while (tup < len);
	free(sa); // Need to free sa
	return;
}

int main(int argc, char** argv) {
	if (argc % 2 != 1) {
		printf("Must have even number of arguments!\n");
		return -1;
	}

	srand ( time(NULL) );
	size_t tup_size = ((argc - 1) / 2); //The number of Tuples, corresponding to the number of arrays we'll print.
	struct SavedMatrix *arrays = malloc(tup_size * 1100 * sizeof(int)); // Just malloc a reasonable amount of space for now.
	struct Tuple tups[tup_size]; // Create an array to hold our tuples.

	for (int i=0; i < tup_size; i+=1) {
		struct Tuple *temp = malloc(sizeof *temp); // Create a temp Tuple to hold our values.
		if ((!isdigit(*argv[(i*2) + 1])) || (!isdigit(*argv[(i*2) + 2]))) { // Make sure our arguments are all integers.
			printf("Arguments must be positive integers!\n");
			return -1;
		}
		temp->fst = atoi(argv[(i*2) + 1]); // Fill our temp tuple with the supplied arguments
		temp->snd = atoi(argv[(i*2) + 2]);
		tups[i] = *temp; 
		free(temp); // Need to free temp
	}
	generateArrayList(tups, tup_size, arrays);
	return 0;
}
