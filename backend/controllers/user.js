const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      email: req.body.email,
      password: hash
    });
    user
      .save()
      .then(result => {
        res.status(201).json({
          message: "User created!",
          result: result
        });
      })
      .catch(err => {
        res.status(500).json({
          message: "Invalid authentication credentials!"
        });
      });
  });
}

exports.userLogin = async (req, res, next) => {
  try {
    const loggedUser = await User.findOne({ email: req.body.email})
    if(!loggedUser) { 
      return res.status(401).json({
        message: "Auth failed"
      });
    } else {
      const resLogin = await bcrypt.compare(req.body.password, loggedUser.password);
      if (!resLogin) {
        return res.status(401).json({
          message: "Auth failed"
        });
      }
      const token = jwt.sign(
        { email: loggedUser.email, userId: loggedUser._id },
        process.env.JWT_KEY,
        { expiresIn: "300" }
      );
      const refreshToken = jwt.sign(        
        { email: loggedUser.email, userId: loggedUser._id },
        process.env.JWT_KEY,
        { expiresIn: '30d' });
      loggedUser.tokens = [...loggedUser.tokens, { token: refreshToken }];
      await loggedUser.save();
      res.status(200).json({
        token: token,
        expiresIn: 300,
        userId: loggedUser._id
      });
    }
  }
  catch (err) {
    return res.status(401).json({
      message: "Invalid authentication credentials!" + `${err}`
    });
  }

}
