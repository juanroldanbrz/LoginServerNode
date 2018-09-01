const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const bcryptStrength = 8;

let UserSchema = new Schema({
    displayName: String,
    fullName: String,
    email: String,
    password: String,
    providerId: String,
    providerName: String,
    profilePic: String,
    created_at: Date,
    updated_at: Date
  });

UserSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(bcryptStrength), null);
  };

let User = mongoose.model('User', UserSchema);
module.exports = User;
