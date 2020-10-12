
// modified from https://www.cs.utexas.edu/~teammco/misc/kalman_filter/ -->
// modified for node.js. added "module.exports = { kalmanClass }" at end.
// npm install sylvester  [sylvester-es6 wouldnt work]
 // with sylvester in node_modules the line 
 // var sylvester = require('sylvester') works, but instead modification
 // was made to use sylvester directly from a file in order to avoid
 // need to use npm to install it.
 
 // lines added to allow sylvester shortcuts when using .js file instead of npm
 var sylvester = require('./sylvester.src.exportAdded.js');
 var $V = sylvester.Vector.create;
 var $M = sylvester.Matrix.create;
 var $L = sylvester.Line.create;
 var $P = sylvester.Plane.create;
 // end lines added
 
        var kalmanClass = function() {
                // kalman vars
                // Matrices
                var mState_Transition;
                var mInput_Control;
                var mMeasurement;
                var mAction_Uncertainty;
                var mSensor_Noise;
                var last_x2;
                var last_P2;
                var control2;
        
                this.initVars = function()  { 
                        // $('#divStatus').html('dotsInit2');
                        last_x2 = $V([0, 0, 0, 0]);
                        last_P2 = $M([
                                [0, 0, 0, 0],
                                [0, 0, 0, 0],
                                [0, 0, 0, 0],
                                [0, 0, 0, 0]
                        ]);
                        this.initMatrices();
                 }
                 
                this.doKalmanEstimatAndPredict = function(cur_xPos, cur_yPos, arrEstX_Y_Predict_X_Y) {
                        // retX[0] = ct++;
                        // KALMAN FILTER CODE [copied] 
                        var velX2 = cur_xPos - last_x2.elements[0];
                        var velY2 = cur_xPos - last_x2.elements[1];
                        var measurement = $V([cur_xPos, cur_yPos, velX2, velY2]);
                        control2 = $V([0, 0, 0, 0]); // TODO - adjust
                        // prediction
                        var x = (mState_Transition.multiply(last_x2)).add(mInput_Control.multiply(control2));
                        var P = ((mState_Transition.multiply(last_P2)).multiply(mState_Transition.transpose())).add(mAction_Uncertainty); 
                        // correction
                        var S = ((mMeasurement.multiply(P)).multiply(mMeasurement.transpose())).add(mSensor_Noise);
                        var K = (P.multiply(mMeasurement.transpose())).multiply(S.inverse());
                        var y = measurement.subtract(mMeasurement.multiply(x));
                        var cur_x = x.add(K.multiply(y));
						// sylvester added along with require('sylvester')
                        var cur_P = ((sylvester.Matrix.I(4)).subtract(K.multiply(mMeasurement))).multiply(P);
                        last_x2 = cur_x;
                        last_P2 = cur_P;
                        // console.log('..kalman  x..:' + cur_x.elements[0] + '  y:' + cur_x.elements[1]);
                        arrEstX_Y_Predict_X_Y[0] = cur_x.elements[0];
                        arrEstX_Y_Predict_X_Y[1] = cur_x.elements[1];
                        // prediction
                        var predX = last_x2;
                        var predictCount = 10; // Math.round(FPS * PREDICT_AMOUNT);
                        for(var i=0; i<predictCount; i++){
                                predX = (mState_Transition.multiply(predX)).add(mInput_Control.multiply(control2));
                         }
                         arrEstX_Y_Predict_X_Y[2] = predX.elements[0];
                         arrEstX_Y_Predict_X_Y[3] = predX.elements[1];
                }
       
                this.initMatrices = function () {
                        mState_Transition = $M([    // State Transition 'A'
                                [1, 0, 0.2, 0],
                                [0, 1, 0, 0.2],
                                [0, 0, 1, 0],
                                [0, 0, 0, 1]
                        ]);
                        mInput_Control = $M([    // Input Control  'B'
                                [1, 0, 0, 0],
                                [0, 1, 0, 0],
                                [0, 0, 1, 0],
                                [0, 0, 0, 1]
                        ]);
                        mMeasurement = $M([     // Measurement  'H'
                                [1, 0, 1, 0],
                                [0, 1, 0, 1],
                                [0, 0, 0, 0],
                                [0, 0, 0, 0]
                        ]);
                      
                        mAction_Uncertainty = $M([     // Action Uncertainty  'Q'
                                [0, 0, 0, 0],
                                [0, 0, 0, 0],
                                [0, 0, 0.1, 0],
                                [0, 0, 0, 0.1]
                        ]);
                        // Sensor Noise 'R' increasing each .1 value to 222 makes it follow very delayed
                        mSensor_Noise = $M([     
                               [0.1, 0, 0, 0],
                                [0, 0.1, 0, 0],
                                [0, 0, 0.1, 0],
                                [0, 0, 0, 0.1]
                        ]);
                }
         }  // end class kalmanClass
// added for node.js
module.exports = { kalmanClass }


