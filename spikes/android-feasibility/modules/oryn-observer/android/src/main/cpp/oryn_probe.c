/* ORYN-owned minimal Android executable probe. No shell, network, file I/O or children. */
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv) {
  if (argc != 2) return 64;
  if (strcmp(argv[1], "normal") == 0) {
    puts("ORYN native stdout");
    fputs("ORYN native stderr\n", stderr);
    return 7;
  }
  if (strcmp(argv[1], "delay") == 0) {
    puts("ORYN native started");
    fflush(stdout);
    sleep(8);
    puts("ORYN native finished");
    return 0;
  }
  return 64;
}
