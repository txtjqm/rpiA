
// 02-28-2019
// this class to be directly run with node.js
// file baroLoop.js
// from https://github.com/dbridges/bmp085-sensor/blob/master/bmp085-sensor.js
var BMP085 = require('./baroDriver_i2c-bus.js');
var kalman = require('./kalmanClass02-22-2019-node.js');
var elevFtAboveGnd = [];

module.exports = function barometerRecorder(options) {
	var sensor = BMP085();
	var kalA = new kalman.kalmanClass(); kalA.initVars();
	var kalArrayEstX_Y_Predict_X_Y = [1,1,1,1];
	readCt = 0;
	var maxLoop = 20;
	var groundElev;
	var readCountForGoodBaseline = 5;
	var kalmanStabilizeCount = 50; // 100 takes 3 seconds
	var elevInFtFiltered = 0;
	var readIntervalMsec = 1000;
	var clientCB;
	
	// dont forget to 'return recorder;'  at end of class
	var recorder = function() {};
	
	recorder.calibrateAndStartRecording = function(callBack) {
		clientCB = callBack;
		// sensor class retrieves calibration data from i2c device and stores it for measurements.
		// call as async because i2c access takes time.
		sensor.calibrateUsingFactoryCalibrateValues(i2cDeviceFactoryCalibrateCB);
	}
	
	function dataSettledAndReady() {
		// now groundElev is set and i2c device and kalman filter is stabilized.
		console.log('dataSettledAndReady readCt: ' + readCt);
		clientCB();
	}
	
	recorder.getElevFtAboveGnd = function() {
		// return elevFtAboveGnd[elevFtAboveGnd.length - 1];
		return ({elevFt: elevFtAboveGnd[elevFtAboveGnd.length - 1][0],
                 tstamp: elevFtAboveGnd[elevFtAboveGnd.length - 1][1]
				});
	};
	
	function i2cDeviceFactoryCalibrateCB (err, data) {
		  if(err || !data) { throw err; }
		  // console.log('factory calibration data: ' + JSON.stringify(data))
		  loopUntilI2cDeviceStabilized(false);
	}

	function loopUntilI2cDeviceStabilized(dataStabilized) {
		if (!dataStabilized) {
			sensor.read(doStabilizeSequence);
		} else {
			sensor.read(onReadI2cDone);
		}
	}

	var calArr = [];
	function getAverage(arrA) {
		var sum = 0;
		// arrA.shift(0); // pop from queue at pos 0     ... calArr.push(val);
		arrA.forEach( function(elem) { sum += Number(elem);  }); // get avg
		avg = sum / arrA.length;
		return avg;
	}

	function doStabilizeSequence(err, data) { 
		if (err || !data) { throw err; }
		var elevInFtRaw = (sensor.pascal_toFeet(data.pascals)); 
		calArr.push(elevInFtRaw);
		console.log('elevInFtRaw ' + elevInFtRaw.toFixed(2) + '  avg: ' + getAverage(calArr));
		readCt ++;
		if (readCt > readCountForGoodBaseline) {
			// i2c device is now stabilized. Now prime kalman object or else it goes up from 0.
			for (; kalmanStabilizeCount > 0; kalmanStabilizeCount--) {
				kalA.doKalmanEstimatAndPredict(getAverage(calArr), 0, kalArrayEstX_Y_Predict_X_Y);
			}
			setTimeout( function() { loopUntilI2cDeviceStabilized(true); }, readIntervalMsec/5); // timeout
		} else {
			setTimeout( function() { loopUntilI2cDeviceStabilized(false); }, readIntervalMsec/5); // timeout
		}
		
	}

	var firstRun = true;
	function onReadI2cDone(err, data) {
		if(err || !data) {
			throw err; 
		}
		var zz = []; 
		var elevInFtRaw = (sensor.pascal_toFeet(data.pascals)); 
		kalA.doKalmanEstimatAndPredict(elevInFtRaw, 0, kalArrayEstX_Y_Predict_X_Y);
		elevInFtFiltered = kalArrayEstX_Y_Predict_X_Y[0]; 
		if (firstRun) { 
			groundElev = elevInFtFiltered; 			
		} 
		zz[0] = (elevInFtFiltered - groundElev).toFixed(2);
		zz[1] = new Date().getSeconds();
		elevFtAboveGnd.push(zz);
		if (firstRun) { dataSettledAndReady(); firstRun = false; }
		readCt ++;
		// since this call is asynchronous, must continue the loop FROM HERE
		setTimeout( function() { sensor.read(onReadI2cDone); }, readIntervalMsec); // timeout
	}


	function getElevInFtFiltered() {
		return elevInFtFiltered;
	}
		
	return recorder;
}
/*
function zzzzzzzzzzzz (err, data) {
      if(err || !data) { throw err; }
      // console.log('factory calibration data: ' + JSON.stringify(data))
	  async.waterfall([
		function stabilizeStep(done) {
		}
	  ], function (err, res) { if (err) { console.log("error 324234"); }});
	  
	  readloopKalman(dataSettledAndReady);
}
*/


/*

	} else {
		console.log(' pre-cal: ' + elevInFtRaw + ' kal: ' + elevInFtFiltered);
	}
	
var elevInFtFilteredArr = []; var elevInFtFilteredLen = 5;
function readloopUsingRunningAverage() {
	sensor.read(function (err, data) {
		if(err || !data) {
		throw err;
	}
	// console.log(data);
	
	var elevInFtFiltered = (sensor.pascal_toMeters(data.pascals) * 3.28); //.toFixed(2);
	var oldVal = elevInFtFiltered;
	// push onto the averaging array
	elevInFtFilteredArr.push(elevInFtFiltered);
	if (readCt >= elevInFtFilteredLen) {  // wait until array has a few entries before pop-ing
		var elevInFtFilteredAvg = 0;
		elevInFtFilteredArr.shift(0); // pop from queue at pos 0
		elevInFtFilteredArr.forEach( function(elem) { elevInFtFilteredAvg += Number(elem);  }); // get avg
		elevInFtFiltered = elevInFtFilteredAvg / elevInFtFilteredArr.length;
		if (groundElev == -9999) groundElev = elevInFtFiltered;
		if (readCt % 3 == 0) {
		  // console.log('elevInFtFiltered: ' + elevInFtFiltered.toFixed(2) + ' oldVal ' + oldVal.toFixed(2))
		  console.log('fromGround: ' + (elevInFtFiltered - groundElev).toFixed(2) + ' elevInFtFiltered: ' + elevInFtFiltered.toFixed(2));
		}
	}

	setTimeout(
		function() {
			if (readCt++ < 10000) readloop();
		}, 300 // timeout
	);
	});
} */


/* for testing multithreading
var count = 0;
function showReadingIsAsynch() {
	console.log(count++)
	setTimeout(
	  function() { if (readCt++ < 1000) showReadingIsAsynch(); }, 200 );
} */

// console.log(data); // it only shows all fields when alone without text.
// now that calibration data is in the sensor object, read sensors.

/* sensor.read(function (err, data) {
if(err || !data) {
  throw err;
}
//console.log(data);
}); */
//readloop();

