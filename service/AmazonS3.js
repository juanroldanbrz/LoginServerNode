const conf = require('../config/Properties').getProperties();
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

let s3;

module.exports = {
    storeFile: function (inputStream, fileName) {
        return new Promise(function (resolve, reject) {
            const params = {
                Bucket: conf.aws.bucket,
                Body: inputStream,
                Key : "data/"+ fileName
            };

            s3.upload(params, function (err, data) {
                if (err) {
                    reject(err);
                }

                if (data) {
                    resolve(data);
                }
            });

        });
    },

    initS3: function () {
        AWS.config.update({
            accessKeyId: conf.aws.userId,
            secretAccessKey: conf.aws.accessKey
        });
        s3 = new AWS.S3();
    }
};

