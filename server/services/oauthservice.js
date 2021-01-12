const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

var config = require('../config/config.json');

// Utility
const Util = require('../utils/globalutility.js');
const { default: Axios } = require('axios');
const utilInstance = new Util();

class OAuthService {

    constructor(){}

    async verifyToken( pToken, pMethod ){
        var xApiUrl = config.api.oAuth.url.verifyToken + "?token=" + pToken + "&method=" + pMethod;
        var xResultVerify = await utilInstance.axiosRequest( xApiUrl, {} );
        return xResultVerify;
    }

};

module.exports = OAuthService;