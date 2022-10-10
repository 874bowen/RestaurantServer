const express = require("express");
const bodyParser = require("body-parser");

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route("/")
.all((req,res, next) => {
     res.statusCode = 200;
     res.setHeader("Content-Type", "text/plain");
     next(); // continue to look for additional specs matching the /dishes endpoint
})
.get((req, res, next) => {
     res.end("Will send all the dishes to you");
})

.post((req, res, next) => {
     res.end("Will add the dish: " + req.body.name + " with details: "+ req.body.description);
})
.put((req, res, next) => {
     res.statusCode = 403
     res.end("put operation not allowed on /dishes");
})
.delete((req, res, next) => {
     res.end("Deleting all the dishes!");
});

dishRouter.route("/:dishId")
.all((req, res, next) => {
     res.statusCode = 200;
     res.setHeader("Content-Type", "text/plain");
     next();
})
.get((req, res, next) => {
     res.end("Will send the details of dish: "+ req.params.dishId + " to you!");
})
.post((req, res, next) => {
     res.statusCode = 403;
     res.end("POST operation not supported on /dishes/"+ req.params.dishId);
})
.put((req, res, next) => {
     res.write("Updating the dish: "+ req.params.dishId + "\n"); // add a line to the reply message
     res.end("Will update the dish: " + req.params.dishId + " with details: "+ req.body.description);
})
.delete((req, res, next) => {
     res.end("deleting the dish: "+ req.params.dishId);
})
module.exports = dishRouter;