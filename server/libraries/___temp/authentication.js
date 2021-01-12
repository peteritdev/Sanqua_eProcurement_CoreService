const modelUser = require('../models').ms_users;
const moment = require('moment');

function Authentication(){

	this.authenticationToken = function( id, token, callback ){
		
		var jsonResult;

		console.log('ID : ' + id);
		console.log('Token : ' + token);
		
		if( id == '' || token == '' ){
			joResult = JSON.stringify({
				'err_code': '-99',
				'err_msg': 'Data not found',
				'token_status':-1
			});
			callback(jsonResult);
		}else{
			modelUser.findOne({
				where:{
					userId: id,
					token: token
				}
			})
			.then(function( user ){
				if( user != null ){
					var dateTokenExpired = user.expiredToken;
					var dateNow = moment().format('YYYY-MM-DD HH:mm:ss');

					if( dateNow > dateTokenExpired ){
						//Expired token
						jsonResult	= JSON.stringify({
							'err_code': '-99',
							'token_status': '-1',
							'err_msg': 'Your session is expired. Please login first.'
						});
						callback(jsonResult);
					}else{

						// Extend expired token
						var tokenExpire = moment().add( config.token_expire, config.token_expire_unit ).format('YYYY-MM-DD HH:mm:ss');

						// Update token
						modelUser.update({
							token: token,
							expireToken: tokenExpire
						},{
							where:{
								userId: id
							}
						});

						jsonResult	= JSON.stringify({
										'err_code': '00',
										'err_msg': 'OK'
									  });
						callback(jsonResult);

					}
				}else{
					jsonResult	= JSON.stringify({
									'err_code': '-99',
									'err_msg': 'Authentication failed. Please check your required parameter.'
								  });
					callback(jsonResult);
				}
			});
		}
	}

}

module.exports = new Authentication();