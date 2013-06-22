/// <reference path="main.ts" />

declare var goog;

module Machine {

	var Long = goog.math.Long;

	export enum Register {
		z,
		at,
		v0, v1,
		a0, a1, a2, a3,
		t0, t1, t2, t3, t4, t5, t6, t7,
		s0, s1, s2, s3, s4, s5, s6, s7,
		t8, t9,
		k0, k1,
		gp,
		sp,
		fp,
		ra
	}

	export enum RFunc {
		sll = 0x00,
		srl = 0x02,
		sra = 0x03,
		sllv = 0x04,
		srlv = 0x06,
		srav = 0x07,
		jr = 0x08,
		jalr = 0x09,
		mfhi = 0x10,
		mflo = 0x12,
		mult = 0x18,
		multu = 0x19,
		div = 0x1a,
		divu = 0x1b,
		add = 0x20,
		addu = 0x21,
		sub = 0x22,
		subu = 0x23,
		and = 0x24,
		or = 0x25, 
		xor = 0x26,
		nor = 0x27,
		slt = 0x2a,
		sltu = 0x2b,
	}

	export enum Opcode {
		arith = 0x00,
		j = 0x02,
		jal = 0x03,
		beq = 0x04,
		bne = 0x05,
		addi = 0x08,
		addiu = 0x09,
		slti = 0x0a,
		andi = 0x0c,
		ori = 0x0d,
		lui = 0x0f,
		lb = 0x20,
		lh = 0x21,
		lw = 0x23,
		lbu = 0x24,
		lhu = 0x25,
		sb = 0x28,
		sh = 0x29,
		sw = 0x2b,
	}

	export enum InstType {
		R, I, J
	}

	export class Inst {
		public type: InstType;
		public opcode: Opcode;
		public rfunc: RFunc;
		public rs: Register;
		public rt: Register;		
		public rd: Register;
		public shamt: number;
		public imm: number;
		public addr: number;
	}

	export var B4 = 0xf;
	export var B5 = 0x1f;
	export var B6 = 0x3f;
	export var B16 = 0xffff;
	export var B26 = 0x3ffffff;

	export function decodeInstruction(word: number): Inst {
		var a = word;

		var inst = new Inst();

		inst.opcode = a >>> 26;    // oooooo-- = = =
		inst.rs = (a >>> 21) & B5; // ------ss sss----- = =
		inst.rt = (a >>> 16) & B5; // =        ---ttttt = =

		// Check to see if it's an R-type
		if (inst.opcode === 0) {
			inst.type = InstType.R;
			inst.rd = (a >>> 11) & B5;    // = = ddddd--- =
			inst.shamt = (a >>> 6) & B5;  // = = -----hhh hh------
			inst.rfunc = a & B6;          // = = =        --ffffff
		}
		else if (inst.opcode === 2 || inst.opcode === 3) {
			inst.type = InstType.J;
			inst.addr = a & B26;
		}
		else {
			inst.type = InstType.I;
			inst.imm = a & B16; // = = iiiiiiii iiiiiiii
		}

		return inst;
	}

	export interface MachineScope extends Main.BodyScope {
		reg: Uint32Array;
		mem: Uint8Array;
		memAs32: Uint32Array;
		getPC():number;
		setPC(number);
		incrPC(number);
		step();
		Register: any;
	}

	export function MachineCtrl($scope: MachineScope) {
		var PC = new Uint32Array(1);
		var HI = new Uint32Array(1);
		var LO = new Uint32Array(1);
		var memBuf = new ArrayBuffer(128*4);
		var mem = new Uint8Array(memBuf);
		var memAs16 = new Uint16Array(memBuf);
		var memAs32 = new Uint32Array(memBuf);
		var reg = new Uint32Array(32);

		function getPC() { return PC[0]; }
		function setPC(v) { return PC[0] = v; }
		function incrPC(i) { return PC[0] += i; }

		function getReg(r: number): number {
			return reg[r];
		}

		function setReg(r: number, value: number) {
			if (r === 0) return;
			reg[r] = value;
		}

		function getByte(i: number):number {
			return mem[i];
		}

		function setByte(i: number, value: number) {
			mem[i] = value;
		}

		function getHalf(i: number):number {
			return memAs16[i >>> 1];
		}

		function setHalf(i: number, value: number) {
			memAs16[i >>> 1] = value;
		}

		function getWord(i: number):number {
			return memAs32[i >>> 2];
		}

		function setWord(i: number, value: number) {
			memAs32[i >>> 2] = value;
		} 

		function executeInstruction(i: Inst) {
			var advancePC = true;
			if (i.type === InstType.R) {
				switch (i.rfunc) {
					case RFunc.sll: setReg(i.rd, getReg(i.rs) << i.shamt); break;
					case RFunc.srl: setReg(i.rd, getReg(i.rs) >> i.shamt); break;
					case RFunc.sra: setReg(i.rd, getReg(i.rs) >>> i.shamt); break; 
					case RFunc.sllv: setReg(i.rd, getReg(i.rs) << getReg(i.rt)); break;
					case RFunc.srlv: setReg(i.rd, getReg(i.rs) >> getReg(i.rt)); break;
					case RFunc.srav: setReg(i.rd, getReg(i.rs) >>> getReg(i.rt)); break;

					case RFunc.jr: PC[0] = getReg(i.rs); break;
					case RFunc.jalr:
						reg[Register.ra] = PC[0]+4;
						PC[0] = getReg(i.rs);
						break;

					case RFunc.mfhi: setReg(i.rd, HI[0]); break;
					case RFunc.mflo: setReg(i.rd, LO[0]); break;

					case RFunc.mult:					
					case RFunc.multu:
						var res = new Long(getReg(i.rs)).multiply(new Long(getReg(i.rt)));
						LO[0] = res.getLowBits();
						HI[0] = res.getHighBits();
						break;

					case RFunc.div:
					case RFunc.divu:
						LO[0] = getReg(i.rs)/getReg(i.rt);
						HI[0] = getReg(i.rs)%getReg(i.rt);
						break;

					case RFunc.addu:
					case RFunc.add:
						setReg(i.rd, getReg(i.rs) + getReg(i.rt)); 
						break;

					case RFunc.sub:
					case RFunc.subu:
						setReg(i.rd, getReg(i.rs) - getReg(i.rt)); 
						break;

					case RFunc.and: setReg(i.rd, getReg(i.rs) & getReg(i.rt)); break;
					case RFunc.or:  setReg(i.rd, getReg(i.rs) | getReg(i.rt)); break;
					case RFunc.xor: setReg(i.rd, getReg(i.rs) ^ getReg(i.rt)); break;
					case RFunc.nor: setReg(i.rd, ~(getReg(i.rs) | getReg(i.rt))); break;

					case RFunc.slt: setReg(i.rd, (getReg(i.rs) < getReg(i.rt)) ? 1 : 0); break;
					//case RFunc.sltu: setReg(i.rd, (getReg(i.rs) < getReg(i.rt)) ? 1 : 0); break;
				}
			}
			else {
				switch (i.opcode) {
					case Opcode.j:
						PC[0] = (PC[0] & 0xf0000000) | (i.addr << 2);
						advancePC = false;
						break;
					case Opcode.jal:
						reg[Register.ra] = PC[0]+4;
						PC[0] = (PC[0] & 0xf0000000) | (i.addr << 2);
						advancePC = false;
						break;

					case Opcode.beq:
						if (getReg(i.rs) === getReg(i.rt)) {
							PC[0] += i.addr << 2;
							advancePC = false;
						}
						break;
					case Opcode.bne:
						if (getReg(i.rs) !== getReg(i.rt)) {
							PC[0] += i.addr << 2;
							advancePC = false;
						}
						break;

					case Opcode.addi:
					case Opcode.addiu:
						setReg(i.rt, getReg(i.rs) + i.imm);
						break;

					case Opcode.slti: setReg(i.rt, (getReg(i.rs) < i.imm) ? 1 : 0); break;
					case Opcode.andi: setReg(i.rt, getReg(i.rs) & i.imm); break;
					case Opcode.ori:  setReg(i.rt, getReg(i.rs) | i.imm); break;
					case Opcode.lui:  setReg(i.rt, i.imm << 16); break;

					case Opcode.lbu:
					case Opcode.lb:
						setReg(i.rt, getByte(getReg(i.rs)+i.imm));
						break;

					case Opcode.lhu:
					case Opcode.lh:
						setReg(i.rt, getHalf(getReg(i.rs)+i.imm));
						break;

					case Opcode.lw: setReg(i.rt, getWord(getReg(i.rs)+i.imm)); break;
					case Opcode.sb: setByte(getReg(i.rs)+i.imm, i.rt); break;
					case Opcode.sh: setHalf(getReg(i.rs)+i.imm, i.rt); break;
					case Opcode.sw: setWord(getReg(i.rs)+i.imm, i.rt); break;

				}
			}		
		}


		function step() {
			var instWord = mem[PC[0]];
			var inst = decodeInstruction(instWord);
			executeInstruction(inst);
			incrPC(4);
		}

		$scope.mem = mem;
		$scope.memAs32 = memAs32;
		$scope.reg = reg
		$scope.getPC = getPC;
		$scope.Register = Register;
		$scope.step = step;
	}

}