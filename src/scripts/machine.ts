/// <reference path="main.ts" />

module Machine {

	enum Register {
		Zero,
		PC
	}

	export interface MachineScope extends Main.BodyScope {
		reg: Uint32Array;
		mem: Uint8Array;
		step();
	}

	export function MachineCtrl($scope: MachineScope) {
		$scope.mem = new Uint8Array(1024*4);
		$scope.reg = new Uint32Array(32);

		console.log($scope.reg);
		console.log($scope);

		$scope.step = function() {
			var reg = $scope.reg;
			var mem = $scope.mem;

			reg[Register.PC] += 4;
			var val = mem[reg[Register.PC]];
			console.log(val);
		}
	}

}