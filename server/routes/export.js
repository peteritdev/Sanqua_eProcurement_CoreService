const exportController = require('../controllers')._export;

var _rootAPIPath = '/api/procurement/v1/';

module.exports = (app) => {
	app.get(_rootAPIPath, (req, res) =>
		res.status(200).send({
			message: 'Welcome to the HR API!'
		})
	);

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, x-token, x-method, x-device, x-device-id'
		);
		next();
	});

	app.get(`${_rootAPIPath}fpb/export_to_pdf/:id`, exportController.generateFPB);
};
