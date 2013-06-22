/// <reference path="machine.ts" />

module HexEditor {

	function padLeft(str:string, pad:string, len:number) {
		return Array(Math.max(0, len + 1 - str.length)).join(pad) + str;
	}

	function hex(n: number, padlen: number = 0) {
		var str = n.toString(16);
		if (padlen === 0) {
			return str;
		}
		return padLeft(str, "0", padlen);
	}

	export interface HexEditorScope extends Machine.MachineScope {
		rows: number;
		cols: number;
		curRow: number;
		hex(n: number):string;
		getByte(row: number, col: number):string;
	}

	export function HexEditorCtrl($scope: HexEditorScope) {
		$scope.cols = 16;
		$scope.rows = 32;
		$scope.curRow = 10;

		$scope.hex = hex;

		$scope.getByte = function(row: number, col: number):string {
			var i = $scope.curRow + row*$scope.cols + col;
			if (i >= $scope.mem.length) {
				return "";
			}
			return hex($scope.mem[i], 2);
		}
		
	}

}