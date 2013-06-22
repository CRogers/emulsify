/// <reference path="machine.ts" />
/// <reference path="assembler.ts" />

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
		getCurRow():number;
		setCurRow(n: number);
		incrCurRow(offset: number);
		hex(n: number):string;
		rowStartLoc(row: number):number;
		rowColLoc(row: number, col: number):number;
		getByte(row: number, col: number):number;
		getHexByte(row: number, col: number):string;
		getByteFormatBase(row: number, col: number):string;
		formatBase: number;
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

		$scope.hex = hex;

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

		$scope.getHexByte = function(row: number, col: number):string {
			var n = $scope.getByte(row, col);
			if (n === undefined) {
				return "";
			}
			return hex(n, 2);
		}

		$scope.getByteFormatBase = function(row: number, col: number):string {
			var n = $scope.getByte(row, col);
			if (n === undefined) {
				return "";
			}
			var padlen = Math.ceil(Math.log(255)/Math.log($scope.formatBase));
			return padLeft(n.toString($scope.formatBase), '0', padlen);
		}

		$scope.formatBase = 16;

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