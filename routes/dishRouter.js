const express = require("express");
const bodyParser = require("body-parser");

const Dishes = require("../models/dishes")
const authenticate = require('../authenticate');
const cors = require('./cors');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

// handling the dishes
dishRouter.route("/")
     .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
     .get(cors.cors, (req, res, next) => {
          Dishes.find({})
               .populate('comments.author')
               .then((dishes) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dishes);
               }, (err) => next(err))
               .catch((err) => next(err));
     })

     .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          Dishes.create(req.body)
               .then((dish) => {
                    console.log("Dish created: " + dish);
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dish);
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          res.statusCode = 403
          res.end("put operation not allowed on /dishes");
     })
     .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          Dishes.remove({})
               .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp)
               }, (err) => next(err))
               .catch((err) => next(err));
     });

dishRouter.route("/:dishId")
     .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
     .get(cors.cors, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .populate('comments.author')
               .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dish)
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          res.statusCode = 403;
          res.end("POST operation not supported on /dishes/" + req.params.dishId);
     })
     .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          Dishes.findByIdAndUpdate(req.params.dishId, {
               $set: req.body
          }, { new: true })
               .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(dish)
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          Dishes.findByIdAndRemove(req.params.dishId)
               .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(resp)
               }, (err) => next(err))
               .catch((err) => next(err));
     })

// handling the comments subdocument
dishRouter.route("/:dishId/comments")
     .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
     .get(cors.cors, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .then((dish) => {
                    console.log("author: " + dish.comments.id.author + " user: ");
                    if (dish != null) {
                         res.statusCode = 200;
                         res.setHeader("Content-Type", "application/json");
                         res.json(dish.comments);
                    } else {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     })

     .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .then((dish) => {
                    if (dish != null) {
                         req.body.author = req.user._id;
                         dish.comments.unshift(req.body);
                         dish.save()
                              .then((dish) => {
                                   Dishes.findById(dish._id).populate('comments.author')
                                        .then((dish) => {
                                             res.statusCode = 200;
                                             res.setHeader("Content-Type", "application/json");
                                             res.json(dish);
                                        })

                              }, (err) => next(err));
                    } else {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
          res.statusCode = 403
          res.end("put operation not allowed on /dishes" + req.params.dishId + "/comments");
     })
     .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .then((dish) => {
                    if (dish) {
                         for (let i = (dish.comments.length - 1); i >= 0; i--) {
                              dish.comments.id(dish.comments[i]).remove();
                         }
                         dish.save()
                              .then((dish) => {
                                   res.statusCode = 200;
                                   res.setHeader("Content-Type", "application/json");
                                   res.json(dish);
                              }, (err) => next(err));
                    } else {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     });

dishRouter.route("/:dishId/comments/:commentId")
     .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
     .get(cors.cors, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .populate('comments.author')
               .then((dish) => {
                    if (dish && dish.comments.id(req.params.commentId)) {
                         res.statusCode = 200;
                         res.setHeader("Content-Type", "application/json");
                         res.json(dish.comments.id(req.params.commentId));
                    } else if (!dish) {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    } else {
                         err = new Error("Comment " + req.params.commentId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
          res.statusCode = 403;
          res.end("POST operation not supported on /dishes/" + req.params.dishId + "/comments/" + req.params.commentId);
     })
     .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .then((dish) => {
                    if (dish && dish.comments.id(req.params.commentId)) {
                         const author_id = dish.comments.id((req.params.commentId)).author;
                         const user_id = req.user._id;
                         if (author_id.equals(user_id)) {
                              if (req.body.rating) {
                                   dish.comments.id(req.params.commentId).rating = req.body.rating;
                              }
                              if (req.body.comment) {
                                   dish.comments.id(req.params.commentId).comment = req.body.comment;
                              }
                              dish.save()
                                   .then((dish) => {
                                        Dishes.findById(dish._id).populate('comments.author')
                                             .then((dish) => {
                                                  res.statusCode = 200;
                                                  res.setHeader("Content-Type", "application/json");
                                                  res.json(dish);
                                             })

                                   }, (err) => next(err));
                         } else {
                              err = new Error("You are not the author of this Comment");
                              res.statusCode = 404;
                              return next(err);
                         }
                    } else if (!dish) {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    } else {
                         err = new Error("Comment " + req.params.commentId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     })
     .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
          Dishes.findById(req.params.dishId)
               .then((dish) => {
                    if (dish && dish.comments.id(req.params.commentId)) {
                         const author_id = dish.comments.id((req.params.commentId)).author;
                         const user_id = req.user._id;
                         if (author_id.equals(user_id)) {
                              dish.comments.id(req.params.commentId).remove();
                              dish.save()
                                   .then((dish) => {
                                        Dishes.findById(dish._id).populate('comments.author')
                                             .then((dish) => {
                                                  res.statusCode = 200;
                                                  res.setHeader("Content-Type", "application/json");
                                                  res.json(dish);
                                             })
                                   }, (err) => next(err));
                         } else {
                              err = new Error("You are not the author of this Comment");
                              res.statusCode = 404;
                              return next(err);
                         }
                    } else if (!dish) {
                         err = new Error("Dish " + req.params.dishId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    } else {
                         err = new Error("Comment " + req.params.commentId + " not found");
                         res.statusCode = 404;
                         return next(err);
                    }
               }, (err) => next(err))
               .catch((err) => next(err));
     })
module.exports = dishRouter;