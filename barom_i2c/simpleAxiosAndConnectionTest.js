

const express = require('express')
const express_app = express()
const port = 3000;
const axios = require('axios') // lets jscript be web svc client
express_app.use(express.static('public'))  // serve html, js etc files from 'public' folder
express_app.listen(port, function() { console.log('Example express_app.. listening on port ' + port + '! \n');});
const ip = require('ip')
console.log('to run as debug => ' + 'nodemon --inspect=' + ip.address() + ' server5.js');
console.log('to get URL for chrome debug => http://' + ip.address() + ':' + 9229 + '/json/list')

express_app.get('/getURL_withAxios', function (req, res) {
	var theURL = 'http://www.nyt.com';
		console.log("getting " + theURL);
		axios.get(theURL).then( 
			function (response) {
				// res.set('Content-Type', 'text/html');
				res.set('Content-Type', 'text/plain');
				res.send('success from ' + theURL + '\n' + response.data);
			}
		).catch(
			function (error) { 
				res.send('error from ' + theURL + '  error ' + error);
			}
		);
	
});
