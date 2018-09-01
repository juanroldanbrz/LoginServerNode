const express = require('express');
const router = express.Router();
const User = require('../model/User');
const mongoose = require('mongoose');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const uuidV4 = require('uuid/v4');
const s3 = require('../service/AmazonS3');

router.get('/:userId', function (req, res, next) {
    const userId = req.params.userId;
    User.findById(userId,
        (err, result) => {
            if (result) {
                {
                    res.json(result._doc);
                }
            } else {
                res.json(err);
            }
        }
    );
});

router.put('/:userId/profile/pic', passport.authenticate('jwt', {session: false}), (req, res) => {
    if (!req.files || req.files.profilePic === undefined) {
        return res.status(400).send('No image was uploaded.');
    }

    const userId = req.params.userId;
    if (userId !== req.user._id.toString()) {
        res.status(500).send('Unauthorized');
    }

    const newProfilePic = req.files.profilePic;
    const profilePicInputStream = newProfilePic.data;

    const profilePicName = newProfilePic.name;
    const fileExtension = profilePicName.split('.').pop();
    if(fileExtension === null || fileExtension === undefined){
        return res.status(400).send('The image does not have extension');
    }

    let nameToStore = uuidV4() + '.' + fileExtension;

    s3.storeFile(profilePicInputStream, nameToStore).then( (storedFileReference) => {
        const newProfilePic = storedFileReference.Location;
        User.update({ _id: userId }, { $set: { profilePic: newProfilePic }}, () => res.json({'profilePic' : newProfilePic}));
    });
});

module.exports = router;
