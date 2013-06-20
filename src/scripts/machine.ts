interface MemoryScope {
	cells: number[];
}

function MemoryCtrl($scope: MemoryScope) {
	$scope.cells = new Array(10);
	for (var i = 0; i < $scope.cells.length; i++) {
		$scope.cells[i] = Math.floor(Math.random()*255);
	}
}