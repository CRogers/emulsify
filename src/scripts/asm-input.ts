/// <reference path="init.ts" />
/// <reference path="assembler.ts" />
/// <reference path="machine.ts" />

module AsmInput {

	declare var angular;

	var lsCodeStore = 'asm-input';

	export interface AsmInputScope extends Machine.MachineScope {
		asmInput: string;
		copyToMem();
	}

	emulsify.controller('AsmInputCtrl', function($scope: AsmInputScope) {
		$scope.asmInput = localStorage[lsCodeStore] || 'add z, z, z\n'; 

		$scope.$watch('asmInput', function(v) {
			localStorage[lsCodeStore] = v;
		});

		$scope.copyToMem = function() {
			var instrs = Assembler.assemble($scope.asmInput);
			for (var i = 0; i < instrs.length; i++) {
				$scope.memAs32[i] = instrs[i];
			}
		}
	});

}