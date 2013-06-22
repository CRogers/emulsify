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
		var memAs32 = new Uint32Array(memBuf);
		var reg = new Uint32Array(32);

		function getPC() { return PC[0]; }
		function setPC(v) { return PC[0] = v; }
		function incrPC(i) { return PC[0] += i; }

		function executeInstruction(i: Inst) {
			if (i.type === InstType.R) {
				switch (i.rfunc) {
					case RFunc.sll: reg[i.rd] = reg[i.rs] << i.shamt; break;
					case RFunc.srl: reg[i.rd] = reg[i.rs] >> i.shamt; break;
					case RFunc.sra: reg[i.rd] = reg[i.rs] >>> i.shamt; break; 
					case RFunc.sllv: reg[i.rd] = reg[i.rs] << reg[i.rt]; break;
					case RFunc.srlv: reg[i.rd] = reg[i.rs] >> reg[i.rt]; break;
					case RFunc.srav: reg[i.rd] = reg[i.rs] >>> reg[i.rt]; break;

					case RFunc.jr: PC[0] = reg[i.rs]; break;
					case RFunc.jalr:
						reg[Register.ra] = PC[0]+4;
						PC[0] = reg[i.rs];
						break;

					case RFunc.mfhi: reg[i.rd] = HI[0]; break;
					case RFunc.mflo: reg[i.rd] = LO[0]; break;

					case RFunc.mult:					
					case RFunc.multu:
						var res = new Long(reg[i.rs]).multiply(new Long(reg[i.rt]));
						LO[0] = res.getLowBits();
						HI[0] = res.getHighBits();
						break;

					case RFunc.div:
					case RFunc.divu:
						LO[0] = reg[i.rs]/reg[i.rt];
						HI[0] = reg[i.rs]%reg[i.rt];
						break;

					case RFunc.addu:
					case RFunc.add:
						reg[i.rd] = reg[i.rs] + reg[i.rt]; 
						break;

					case RFunc.sub:
					case RFunc.subu:
						reg[i.rd] = reg[i.rs] - reg[i.rt]; 
						break;

					case RFunc.and: reg[i.rd] = reg[i.rs] & reg[i.rt]; break;
					case RFunc.or:  reg[i.rd] = reg[i.rs] | reg[i.rt]; break;
					case RFunc.xor: reg[i.rd] = reg[i.rs] ^ reg[i.rt]; break;
					case RFunc.nor: reg[i.rd] = ~(reg[i.rs] | reg[i.rt]); break;

					case RFunc.slt: reg[i.rd] = (reg[i.rs] < reg[i.rt]) ? 1 : 0; break;
					//case RFunc.sltu: reg[i.rd] = (reg[i.rs] < reg[i.rt]) ? 1 : 0; break;
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