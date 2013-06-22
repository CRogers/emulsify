/// <reference path="machine.ts" />
/// <reference path="assembler.ts" />

module HexEditor {

	function padLeft(str:string, pad:string, len:number) {
		return Array(Math.max(0, len + 1 - str.length)).join(pad) + str;
	}

	export interface HexEditorScope extends Machine.MachineScope {
		rows: number;
		cols: number;
		getCurRow():number;
		setCurRow(n: number);
		incrCurRow(offset: number);
		rowStartLoc(row: number):number;
		rowColLoc(row: number, col: number):number;
		padMaxBase(max: number, base: number, n: number, pad?: string):string
		getByte(row: number, col: number):number;
		getByteBase(row: number, col: number):string;
		byteBase: number;
		addrBase: number;
		asciiOutput(row: number):string;
		instrOutput(row: number):string;
		output(row: number):string;
		selectedOutput: string;
	}

	export function HexEditorCtrl($scope: HexEditorScope) {
		$scope.cols = 16;
		$scope.rows = 24;
		var curRow = 10;

		$scope.getCurRow = function():number {
			return curRow;
		}

		$scope.setCurRow = function(n: number) {
			curRow = Math.max(0, Math.min(n, Math.ceil($scope.mem.length/$scope.cols)-$scope.rows))
		}

		$scope.incrCurRow = function(offset: number) {
			$scope.setCurRow($scope.getCurRow() + offset);
		}

		function rowStartLoc(row: number) {
			return ($scope.getCurRow() + row) * $scope.cols;
		}

		function rowColLoc(row: number, col: number) {
			return rowStartLoc(row) + col;
		}

		$scope.rowStartLoc = rowStartLoc;
		$scope.rowColLoc = rowColLoc;

		$scope.getByte = function(row: number, col: number):number {
			var i = rowColLoc(row, col);
			if (i >= $scope.mem.length) {
				return undefined;
			}
			return $scope.mem[i];
		}

		function padMaxBase(max: number, base: number, n: number, pad: string = '0'):string {
			var padlen = Math.ceil(Math.log(max)/Math.log(base));
			return padLeft(n.toString(base), pad, padlen);
		}
		$scope.padMaxBase = padMaxBase;

		$scope.getByteBase = function(row: number, col: number):string {
			var n = $scope.getByte(row, col);
			if (n === undefined) {
				return "";
			}
			return $scope.padMaxBase(255, $scope.byteBase, n);
		}

		$scope.byteBase = 16;
		$scope.addrBase = 16;

		$scope.asciiOutput = function(row:number):string {
			var startLoc = rowStartLoc(row);
			var ret = '';
			for (var i = 0; i < $scope.cols; i++) {
				ret += String.fromCharCode($scope.mem[startLoc+i]);
			}
			return ret;
		}

		$scope.instrOutput = function(row:number):string {
			var startLoc = rowStartLoc(row)/4;
			var ret = [];
			for (var i = 0; i < $scope.cols/4; i++) {
				var word = $scope.memAs32[startLoc+i];
				var instr = Assembler.disassembleInstruction(word);
				ret.push(instr.indexOf(undefined) !== -1 ? "invalid" : instr);
			}
			return ret.join("<br>");
		}

		$scope.output = function(row: number):string {
			switch ($scope.selectedOutput) {
				case 'ascii': return $scope.asciiOutput(row);
				case 'instr': return $scope.instrOutput(row);
			}
		}

		$scope.selectedOutput = 'ascii';
	}

}