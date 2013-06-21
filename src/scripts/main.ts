module Main {

	export interface BodyScope {
		Math: any;
		range(number): number[];
	}

	export function BodyCtrl($scope: BodyScope) {
		$scope.Math = Math;

		$scope.range = function(n) {
			var arr = new Array(n);
			for (var i = 0; i < arr.length; i++) {
				arr[i] = i;
			}
			return arr;
		}
	}

}