


var barometerRecorder = require('./barometerRecorder.js');
var recorder = barometerRecorder();
recorder.calibrateAndStartRecording(showElevCB);  

// dont call directly bc data may not be stabilized yet. Only as callback
function showElevCB() {
	var data = recorder.getElevFtAboveGnd();
	var timeoutMsec = 1000;
	console.log('showElev ' + data.elevFt
		+ ' tstamp ' + data.tstamp);
	setTimeout( function() { 
		showElevCB(); // call recursive after delay of timeoutMsec
	}, timeoutMsec); 
}