/// <reference path="init.ts" />
/// <reference path="main.ts" />

module TabbedInput {

	export interface TabbedInputScope extends Main.BodyScope {
		tabSalt: string;
		tabs: Array<string>;
		selectedTab: string;
	}

	emulsify.controller('TabbedInputCtrl', function($scope) {
		$scope.tabSalt
	});

}