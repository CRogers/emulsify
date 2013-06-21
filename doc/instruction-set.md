Instruction Set
===

Conceptionally similar to MIPS, all instructions are 32-bits wide. They come in 4 different versions:

Opcode Layouts
---

R: | opcode (6) | rd (5) | rs (5) | rt (5) | sh (6) | func (5) |
I: | opcode (6) | rd (5) | rs (5) |       immediate (6)        |
J: | opcode (6) |                address (26)                  |

R-Type
---

opcode: 00000000

nop
00000000 00000000 00000000 00000000

add: 0
sub: 1
mul: 2
div: 3

and: 4
or:  5