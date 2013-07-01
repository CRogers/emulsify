/// <reference path="libdefs/angularjs/angular.d.ts" />
/// <reference path="libdefs/jquery/jquery.d.ts" />

module Main {

	export interface BodyScope extends ng.IScope {
		Math: any;
		range(number): number[];
	}

	angular.module('emulsify')
	.controller('BodyCtrl', function ($scope: BodyScope) {
		$scope.Math = Math;

		$scope.range = function(n) {
			var arr = new Array(n);
			for (var i = 0; i < arr.length; i++) {
				arr[i] = i;
			}
			return arr;
		}
	});

}