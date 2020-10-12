
// from rpi, run "npm i onoff"
const Gpio = require('onoff').Gpio;
const button = new Gpio(14, 'in', 'both');
/*
button.watch((err, value) => {
  if (err) {
    throw err;
  }
  console.log('watch ' + value);
});
*/
var count = 0;
doLoop();
function doLoop() {
	var timeoutMsec = 1000;
	console.log("count--> " + count++ + ' val: ' + 
		button.readSync());
	setTimeout( function() { 
		doLoop(); // call recursive after delay of timeoutMsec;
	}, timeoutMsec); 
}





/*
function readPin(err) {
	if (err) throw err;
	gpio.read(14, function(err, value) {
		if (err) throw err;
		console.log('value: ' + value);
	});
}*/