///////////////////

// 02-27-2019 
// file baroDriver_i2c-bus.js
// from https://github.com/dbridges/bmp085-sensor/blob/master/bmp085-sensor.js
var async = require('async');
var i2c = require('i2c-bus');

module.exports = function BMP085(options) {
  var BUSNUMBER 			   = 1;
  var BMP085_CONTROL_REGISTER  = 0xF4;
  var BMP085_SELECT_TEMP       = 0x2E;
  var BMP085_SELECT_PRESSURE   = 0x34;
  var BMP085_CONVERSION_RESULT = 0xF6;
  var BMP085_XLSB              = 0xF7;
  
  BMP_I2C_ADDR = 0x77;
  BMP_I2C_MODE = 0;
  BMP_I2C_UNITS = 'inHG'
  // TEMPERATURE_UNITS = 'metric';
  TEMPERATURE_UNITS = 'farenheit';
  
  var sensor = function() {}; // future lines setup/define its functions
  
  //var theI2Cbus = i2c.openSync(BUSNUMBER);
  var theI2Cbus = i2c.open(BUSNUMBER, function (err) {
	  if (err) console.log("error opening bus: " + err);
  });
  var calibrateBlock = {}; // gets set with calibrate data from device
  
  sensor.scan = function () {
    theI2Cbus.scan(function (err, data) {
      data.forEach(function (item) {
        console.log('sensor.scan(): ' + item);
      });
    });
  };

  function toS16(high, low) {
      if (high > 127)
          high -= 256;
      return (high << 8) + low;
  }

  function toU16(high, low) {
    return (high << 8) + low;
  }
  
  function setupCalibrateBlock(data) {
	  calibrateBlock = {
		ac1: toS16(data[0], data[1]),
		ac2: toS16(data[2], data[3]),
		ac3: toS16(data[4], data[5]), 
		ac4: toU16(data[6], data[7]),
		ac5: toU16(data[8], data[9]),
		ac6: toU16(data[10], data[11]),
		b1:  toS16(data[12], data[13]),
		b2:  toS16(data[14], data[15]),
		mb:  toS16(data[16], data[17]),
		mc:  toS16(data[18], data[19]),
		md:  toS16(data[20], data[21])
	  };
  }

  // gets called from main class
  sensor.calibrateUsingFactoryCalibrateValues = function (doneCalibratingCB) {
    data = Buffer.alloc(22);
    theI2Cbus.readI2cBlock(BMP_I2C_ADDR,0xAA, 22, data, 
		function (err, byteCt, data) {
		  if (err) {
			console.log("error reading calibration data");
			return;
		  }
		  setupCalibrateBlock(data);
		  // console.log("sample calibration data..:\n" + data[2] + "   " + data[3]);
		  doneCalibratingCB(err, calibrateBlock);
		});
  };

  sensor.read = function (readFcnCallback) {
    async.waterfall(
	[
      function (callback) {
        // Write select pressure command to control register
		var cmd = BMP085_SELECT_PRESSURE + (BMP_I2C_MODE << 6);
        // theI2Cbus.writeBytes(BMP085_CONTROL_REGISTER,
        theI2Cbus.writeByte(BMP_I2C_ADDR, BMP085_CONTROL_REGISTER,
			cmd,
				function(err, data) {
				   setTimeout(function () { callback(err); }, 28);
				});
      },
      function (callback) {
        // Read uncalibrated pressure.
		data = Buffer.alloc(3);
		theI2Cbus.readI2cBlock(BMP_I2C_ADDR, BMP085_CONVERSION_RESULT, 3, data,
		function (err, byteCt, data) {
			  callback(null, ((data[0] << 16) + (data[1] << 8) + data[2]) 
					   >> (8 - BMP_I2C_MODE));
        });
      },
      function (pressure, callback) {
        theI2Cbus.writeByte(BMP_I2C_ADDR, BMP085_CONTROL_REGISTER, 
		BMP085_SELECT_TEMP,
			function(err, data) {
			  setTimeout(function () { callback(err, pressure); }, 8);
			});
      },
      function (pressure, callback) { 
			data = Buffer.alloc(2);
			theI2Cbus.readI2cBlock(BMP_I2C_ADDR, BMP085_CONVERSION_RESULT, 2, data,
			function (err, byteCt, data) {
				  callback(null, [pressure, toU16(data[0], data[1])]);
			});
	  }
    ], function (err, res) {
      if (err)
        readFcnCallback(err, {});
      var uncal_pressure = res[0];
      var uncal_temp = res[1];

      // Get calibrated temp
      var x1 = 0;
      var x2 = 0;
      var x3 = 0;
      var b3 = 0;
      var b4 = 0;
      var b5 = 0;
      var b6 = 0;
      var b7 = 0;
      var pascals = 0;

      x1 = ((uncal_temp - calibrateBlock.ac6) * calibrateBlock.ac5) >> 15;
      x2 = (calibrateBlock.mc << 11) / (x1 + calibrateBlock.md);
      b5 = x1 + x2;

      var corrected_temp = ((b5 + 8) >> 4) / 10.0;
      if (TEMPERATURE_UNITS == 'farenheit')
        corrected_temp = (9 * corrected_temp / 5) + 32;

      // Get calibrated pressure
      x1 = 0;
      x2 = 0;
      x3 = 0;
      b3 = 0;
      b4 = 0;
      b5 = 0;
      b6 = 0;
      b7 = 0;
      pascals = 0;

      x1 = ((uncal_temp - calibrateBlock.ac6) * calibrateBlock.ac5) >> 15;
      x2 = (calibrateBlock.mc << 11) / (x1 + calibrateBlock.md);
      b5 = x1 + x2;

      b6 = b5 - 4000;
      x1 = (calibrateBlock.b2 * (b6 * b6) >> 12) >> 11;
      x2 = (calibrateBlock.ac2 * b6) >> 11;
      x3 = x1 + x2;
      b3 = (((calibrateBlock.ac1 * 4 + x3) << BMP_I2C_MODE) + 2) / 4;
      x1 = (calibrateBlock.ac3 * b6) >> 13;
      x2 = (calibrateBlock.b1 * ((b6 * b6) >> 12)) >> 16;
      x3 = ((x1 + x2) + 2) >> 2;
      b4 = (calibrateBlock.ac4 * (x3 + 32768)) >> 15;
      b7 = (uncal_pressure - b3) * (50000 >> BMP_I2C_MODE);

      if (b7 < 0x80000000)
          pascals = (b7 * 2) / b4;
      else
          pascals = (b7 / b4) * 2;

      x1 = (pascals >> 8) * (pascals >> 8);
      x1 = ((x1 * 3038) >> 16);
      x2 = ((-7357 * pascals) >> 16);
      pascals = pascals + ((x1 + x2 + 3791) >> 4);

      readFcnCallback(err, { 
				pascals: pascals
                // temp: corrected_temp
				//hPa: hPa
				});
    });
  };

  /* https://www.math24.net/barometric-formula/
	 ///height h above sea level is expressed in meters
	 If the pressure is given in millimeters of mercury (mmHg ) ,  
	 the barometric formula is written in the form: 
	 P ( h ) = 760 exp ( − 0.00012 h ) [ mmHg ] ... */
  function pascal_toMeters(pascals) {
	var hPa = pascals/100; // (1 hectoPascal = 1 millibar  mbar)
	var mmHg = hPa * .75;  // mm of Mercury
	var x1 = Math.log(mmHg/760);
	var meters = x1/-0.00012;
	return meters;
  }
  
  function pascal_toFeet(pascals) {
	  return pascal_toMeters(pascals) * 3.28;
  }
  
  // make it externally accessable
  sensor.pascal_toMeters = pascal_toMeters;
  sensor.pascal_toFeet = pascal_toFeet;

  return sensor;
};

	  // hPa = pascals/100; // (1 hectoPascal = 1 millibar  mbar)
	  // inHG = hPa * 0.0295300;  // inches mercury // https://www.weather.gov/media/epz/wxcalc/pressureConversion.pdf

	  //var feetFromSurface = pascal_toMeters(pascals) * 3.28;
	  //feetStart = -9999; 
	  //if (feetStart == -9999) {
		// feetStart = feetFromSurface;
	  //}

	  //feetFromSurface = feetFromSurface - feetStart;
