var http = require('http');
var exec = require('child_process').exec;
var request = require('request');
var fs = require('fs');
var url = require("url");

const PORT = 9000;

http.createServer(handle).listen(9000);

function handle(request, response) {

	var uri = url.parse(request.url).pathname;

	console.log(uri);

	if(uri === '/rtrack'){

		track_route('google.com', function(data){

			console.log(typeof JSON.stringify(data));
			console.log(data);
			response.writeHead(200);
			response.write(JSON.stringify(data));
			response.end();
		});
	}else if(uri === '/'){
		fs.readFile("index.html", "binary", function(err, file) {
			if(err) {
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(err + "\n");
				response.end();
				return;
			}

			response.writeHead(200);
			response.write(file, "binary");
			response.end();
		});
	}
}

function track_route(dest, callback){
	var cmd = 'traceroute -n ' + dest + ' | awk \'{print $2}\' | grep "\\."';
	exec(cmd, function(error, stdout, stderr){

		if(error){
			console.log(error);
		}else{
			var ips = stdout.split('\n').filter(function(n){
				return (n !== '')
			});

			get_locations(ips, function(err, locations){
				callback(locations);
			});
		}
	});
}

function get_locations(ips, callback){
	if(ips.length <= 0){
		callback('No ips to geolocate.', null);
	}

	var cur_done = 0;
	var locations = {};
	ips.forEach(function(ip){
		request.get('http://ip-api.com/json/' + ip, function (err, res) {
			var location = JSON.parse(res.body);
			if(location.status !== 'fail'){
				locations[ip] = location;
			}

			cur_done++;
			if(cur_done === ips.length){
				callback(null, locations);
			}
		});
	});
}

