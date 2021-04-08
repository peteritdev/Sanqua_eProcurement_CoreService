const jwt = require('jsonwebtoken');
const env         = process.env.NODE_ENV || 'localhost';
const config      = require('../../config/config.json')[env];

function JWTAuth(){

	this.checkJWTAuth = function( jwtToken, callback ){

		var jsonResult;

		if( jwtToken.startsWith('Bearer ') ){
			jwtToken = jwtToken.slice(7, jwtToken.length);
			console.log('Secret : ' + jwtToken);
			console.log('>>>YES');
		}else{
			console.log('>>>NO');
		}

		if( jwtToken ){
			jwt.verify( jwtToken, config.secret, (err,decoded) => {
				if( err ){
					jsonResult = JSON.stringify({
						'status_code': '-99',
						'status_msg': 'Token is not valid'
					});
					callback(jsonResult); 
				}else{
					jsonResult = JSON.stringify({
						'status_code': '00',
						'status_msg':'Token valid'
					});
					callback(jsonResult);
				}
			} );
		}else{
			jsonResult = JSON.stringify({
				'status_code': '-99',
				'status_msg':'Auth token is not supplied'
			});
			callback(jsonResult);
		}

	}

}

module.exports = new JWTAuth();