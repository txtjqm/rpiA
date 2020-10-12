
// uses  kalman as a js file, not in  node_modules
// npm install sylvester  [sylvester-es6 wouldnt work]
var sylvester = require('./sylvester.src.exportAdded.js')
var foo = sylvester.Matrix.I(4);
console.log("foo:" + foo);

var kalman = require('./kalmanClass02-22-2019-node.js');
// var sylvester =  require('./sylvester.min.cdnjs.js');
var kalA = new kalman.kalmanClass(); kalA.initVars();
var arrEstX_Y_Predict_X_Y = [1,1,1,1]; // array to receive estimated x,y and predicted x,y
var measured = [4,5,6,5,9,5,4,9,4];

sum = 0;
measured.forEach( function(elem) { 
	kalA.doKalmanEstimatAndPredict(elem, 0, arrEstX_Y_Predict_X_Y);
	sum += elem;
});
 console.log("kalman:" + arrEstX_Y_Predict_X_Y[0] + " avg: " + sum/measured.length);



	