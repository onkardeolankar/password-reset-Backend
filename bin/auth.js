let authenticate = function (request, response, next) {
    // console.log(request.headers);
    if (request.headers.authorization) {
      let verify = jwt.verify(request.headers.authorization, process.env.SECRET);
      console.log(verify);
      if (verify) {
        request.userid = verify.id;
  
        next();
      } else {
        response.status(401).json({
          message: "Unauthorized",
        });
      }
    } else {
      response.status(401).json({
        message: "Unauthorized",
      });
    }
  };

  module.exports={authenticate}