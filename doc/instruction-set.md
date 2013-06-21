Instruction Set
===

Conceptionally similar to MIPS, all instructions are 32-bits wide. They come in 4 different versions:

Opcode Layouts
---

R: | opcode (6) | rd (5) | rs (5) | rt (5) | sh (7) | func (4) |
   oooooodd dddsssss ttttthhh hhhhffff
I: | opcode (6) | rd (5) | rs (5) |       immediate (16)       |
   oooooodd dddsssss iiiiiiii iiiiiiii
J: | opcode (6) |                address (26)                  |
   ooooooaa aaaaaaaa aaaaaaaa aaaaaaaa
R-Type
---

opcode: 000000

nop
00000000 00000000 00000000 00000000

add: 0
sub: 1
mul: 2
div: 3

and: 4
or:  5
xor: 6

I-Type
---

opcode:
	immediate arith: 10ffff
	memory: 11mmmm

memfunc:
	lw: 0

J-Type
---

opcode: 0jjjjj

jfunc:
	j: 1
	jr: 2
	jal: 3