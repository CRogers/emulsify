/// <reference path="main.ts" />

module Machine {

	export enum Register {
		zero,
		at,
		v0, v1,
		a0, a1, a2, a3, a4, a5, a6, a7,
		t0, t1, t2, t3, t4, t5,
		s0, s1, s2, s3, s4, s5, s6, s7,
		k0, k1,
		gp,
		sp,
		fp,
		ra
	}

	export enum ArithFunc {
		add,
		sub,
		mul,
		div,
		and,
		or
	}

	export enum MemFunc {
		lw,
		lh,
		lb,
		sw,
		sh,
		sb,
		lui
	}

	export enum InstType {
		R, I, J
	}

	export class Inst {
		public instType: InstType;
		public memFunc: MemFunc;
		public arithFunc: ArithFunc;
		public rd: Register;
		public rs: Register;
		public rt: Register;
		public sh: number;
		public immediate: number;
		public address: number;
	}

	var B4 = 0xf;
	var B5 = 0x1f;
	var B7 = 0x7f;
	var B16 = 0xffff;
	var B26 = 0x3ffffff;

	export function decodeInstruction(arr: Uint32Array, i: number): Inst {
		var a = arr[i];

		var inst = new Inst();

		var opcode = a >> 26;      // oooooo-- = = =
		inst.rd = (a >> 21) & B5; // ------dd ddd----- = =
		inst.rs = (a >> 16) & B5; // = ---sssss = =

		// Check to see if it's an R-type
		if (opcode === 0) {
			inst.instType = InstType.R;
			inst.rt = (a >> 11) & B5; // = = ttttt--- =
			inst.sh = (a >> 4) & B7;  // = = -----hhh hhhh----
			inst.arithFunc = a & B4;        // = = =        ----ffff
		}
		else if ((opcode >> 5) === 1) {
			inst.instType = InstType.I;
			inst.immediate = a & B16; // = = iiiiiiii iiiiiiii
			if (((opcode >> 4) & 1) === 1) {
				inst.memFunc = opcode & B4;
			}
			else {
				inst.arithFunc = opcode & B4;
			}
		}
		else {
			inst.instType = InstType.J;
			inst.address = a & B26;
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
		var memBuf = new ArrayBuffer(128*4);

		$scope.mem = new Uint8Array(memBuf);
		$scope.memAs32 = new Uint32Array(memBuf);
		$scope.reg = new Uint32Array(32);
		$scope.getPC = function()  { return PC[0]; }
		$scope.setPC = function(v) { PC[0] = v; }
		$scope.incrPC = function(i) { PC[0] += i; }
		$scope.Register = Register;

		$scope.step = function() {
			var reg = $scope.reg;
			var mem = $scope.mem;

			$scope.incrPC(1);
			var val = mem[$scope.getPC()];
		}
	}

}