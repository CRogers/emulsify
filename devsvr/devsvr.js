var express = require('express');
var exec = require('child_process').exec;
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');
var jade = require('jade');

var app = express();
const APP_DIR = path.resolve(path.join('..','src'));
const SCRIPTS_DIR = path.join(APP_DIR, 'scripts');
const SCRIPTS_LIB = path.join(SCRIPTS_DIR, 'lib');
const STYLES_DIR = path.join(APP_DIR, 'styles');

function apploc(loc) {
	return path.join(APP_DIR, loc);
}

function scriptloc(loc) {
	return path.join(SCRIPTS_DIR, loc);
}

function styleloc(loc) {
	return path.join(STYLES_DIR, loc);
}

function runProcess(res, exe, loc, rext, cext) {
	exec(exe + ' ' + loc + rext, function(err, stdout, stderr) {
		if(stderr !== '') {
			res.send("Error:\n\n" + stderr);
			res.status(500);
		}
		else {
			res.sendfile(loc + cext);
		}
	});
}

function htmlReq(res, name) {
	var loc = apploc(name);
	runProcess(res, 'jade', loc, '.jade', '.html');
}

app.get('/', function(req,res) {
	return htmlReq(res, 'app');
});

app.get('/:name.html', function(req, res) {
	return htmlReq(res, req.params.name);
});

app.get('/scripts/:name.js', function(req, res) {
	var loc = scriptloc(req.params.name);
	runProcess(res, 'tsc', loc, '.ts', '.js');
});

app.configure(function(){
	app.use(stylus.middleware({
		src: APP_DIR,
		compile: function(str, path) {
			return stylus(str)
				.set('filename', path)
				.set('compress', true)
				.use(nib());
			}
	}));
	app.use(express.static(APP_DIR));
});


app.listen(3030);