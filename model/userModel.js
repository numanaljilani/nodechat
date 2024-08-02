const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    userId : Number
  });
  
  const User = mongoose.model('User', userSchema);

  module.exports = User;