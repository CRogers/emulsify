/// <reference path="libdefs/jquery/jquery.d.ts" />

module Grabber {
	var grabbed = {};

	export function grab(loc:string, callback) {
		if (grabbed[loc]) {
			callback(grabbed[loc]);
		}
		else {
			$.ajax({
				url: loc,
				method: 'GET',
				success: (data) => {
					grabbed[loc] = data;
					callback(data);
				}
			});
		}
	}
}