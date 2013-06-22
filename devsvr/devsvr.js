var express = require('express');
var exec = require('child_process').exec;
var path = require('path');
var stylus = require('stylus');
var nib = require('nib');
var jade = require('jade');
var fs = require('fs');

var app = express();
const APP_DIR = path.resolve(path.join('..','src'));
const OUT_DIR = path.resolve(path.join('..','out'));
const SCRIPTS_DIR = path.join(APP_DIR, 'scripts');
const SCRIPTS_OUT_DIR = path.join(OUT_DIR, 'scripts');
const STYLES_DIR = path.join(APP_DIR, 'styles');
const STYLES_OUT_DIR = path.join(OUT_DIR, 'styles');

function apploc(loc) {
	return path.join(APP_DIR, loc);
}

function scriptloc(loc) {
	return path.join(SCRIPTS_DIR, loc);
}

function styleloc(loc) {
	return path.join(STYLES_DIR, loc);
}

function runProcess(res, exe, loc, outloc, midfunc) {
	exec(exe + ' ' + loc, function(err, stdout, stderr) {
		if(stderr !== '') {
			res.send("Error:\n\n" + stderr);
			res.status(500);
		}
		else {
			if (midfunc) {
				midfunc();
			}
			res.sendfile(outloc);
		}
	});
}

function htmlReq(res, name) {
	var loc = apploc(name) + '.jade';
	var outloc = path.join(OUT_DIR, name) + '.html';
	runProcess(res, 'jade --out ' + OUT_DIR, loc, outloc);
}

app.get('/', function(req,res) {
	return htmlReq(res, 'app');
});

app.get('/:name.html', function(req, res) {
	return htmlReq(res, req.params.name);
});

app.get('/scripts/:name.js', function(req, res) {
	var nloc = scriptloc(req.params.name);
	var loc = nloc + '.ts';
	var intermediateOut = nloc + '.js';
	var outloc = path.join(SCRIPTS_OUT_DIR, req.params.name) + '.js';
	runProcess(res, 'tsc --out ' + SCRIPTS_OUT_DIR, loc, outloc);
});

app.configure(function(){
	app.use(stylus.middleware({
		src: APP_DIR,
		dest: OUT_DIR,
		compile: function(str, path) {
			return stylus(str)
				.set('filename', path)
				.set('compress', true)
				.use(nib());
			}
	}));
	app.use(express.static(OUT_DIR));
});


app.listen(3030);