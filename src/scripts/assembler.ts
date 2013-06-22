/// <reference path="grabber.ts" />
/// <reference path="machine.ts" />

declare var PEG;

module Assembler {
	export var grammar;
	export var parser;

	var RFunc = Machine.RFunc;
	var Opcode = Machine.Opcode;
	var Register = Machine.Register;
	var Inst = Machine.Inst;
	var InstType = Machine.InstType
	
	Grabber.grab("scripts/grammar.peg", (data) => {
		grammar = data;
		parser = PEG.buildParser(grammar);
	});

	export function assembleInstruction(instr:any) {
		var r = 0;
		if (instr.rs !== undefined) {
			r |= +Register[instr.rs] << 21;
		}
		if (instr.rt !== undefined) {
			r |= +Register[instr.rt] << 16;
		}
		if (instr.rd !== undefined) {
			r |= +Register[instr.rd] << 11;
		}
		if (instr.shamt !== undefined) {
			r |= (instr.shamt & Machine.B5) << 6;
		}
		if (instr.imm !== undefined) {
			r |= (instr.imm & Machine.B16);
		}
		if (instr.addr !== undefined) {
			r |= (instr.addr & Machine.B26);
		}

		var opcode = Opcode[instr.mnemonic];
		if (opcode === undefined) {
			var rfunc = RFunc[instr.mnemonic];
			if (rfunc === undefined) {
				throw "Incorrect mnemonic: " + instr.mnemonic;
			}
			else {
				r |= (+rfunc & Machine.B6);
			}
		}
		else {
			r |= +opcode << 26;
		}

		return r;
	}

	export function assemble(str:string) {
		var pinsts = parser.parse(str);
		return pinsts.map(assembleInstruction);
	}

	function disArg(value: any, first: bool = false) {
		return (first ? " " : ", ") + value.toString();
	}

	function disReg(reg: number, first: bool = false) {
		return disArg(Register[reg], first);
	}

	function disRegs(...regs: number[]) {
		if (regs.length === 0) return "";
		var ret = disReg(regs[0], true);
		for (var i = 1; i < regs.length; i++) {
			ret += disReg(regs[i]);
		}
		return ret;
	}

	export function disassembleInstruction(instrWord: number) {
		var i = Machine.decodeInstruction(instrWord);
		switch (i.type) {
			case InstType.R:
				var op = RFunc[i.rfunc]
				switch (i.rfunc) {
					case RFunc.sll:
					case RFunc.srl:
					case RFunc.sra:
						return op + disRegs(i.rd, i.rs) + disArg(i.shamt);

					case RFunc.mult:
					case RFunc.multu:
					case RFunc.div:
					case RFunc.divu:
						return op + disRegs(i.rs, i.rt);

					case RFunc.mfhi:
					case RFunc.mflo:
						return op + disRegs(i.rd);

					case RFunc.jr:
						return op + disRegs(i.rs);

					default:
						return op + disRegs(i.rd, i.rs, i.rt);
				}
			case InstType.I:
				var op = Opcode[i.opcode];
				switch (i.opcode) {
					case Opcode.addiu:
					case Opcode.addi:
					case Opcode.slti:
					case Opcode.andi:
					case Opcode.ori:
						return op + disRegs(i.rt, i.rs) + disArg(i.imm);

					case Opcode.lui:
						return op + disRegs(i.rt) + disArg(i.imm);

					case Opcode.beq:
					case Opcode.bne:
						return op + disRegs(i.rs, i.rt) + disArg(i.imm);

					default:
						return op + disRegs(i.rt) + disArg(i.imm + "(" + Register[i.rs] + ")")
				}

			case InstType.J:
				return Opcode[i.opcode] + disArg(i.addr, true);
		}
	}

	export function test(instr:string):string {
		var i = assemble(instr + '\n');
		return disassembleInstruction(i[0]);
	}
}