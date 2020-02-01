const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorite');
const Dishes = require('../models/dishes');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.find({})
        .populate('user')
        .populate('dishes')
        .then((dishes) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dishes);
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        console.log("req:", req.body);
        Favorites.findOne({user: req.user._id})
        .then((favorites) => {
            if (favorites != null){
                console.log("favorite: ", favorites);
                if (favorites != null){
                    var exists = false;
                    for(var i = (req.body.length - 1); i >=0; i--){
                        for(var x = (favorites.dishes.length - 1); x >=0; x--){
                            if(favorites.dishes[x]._id == req.body[i]._id){
                                exists = true;
                                break;
                            }
                        }
                        if(!exists){
                            favorites.dishes.push(mongoose.Types.ObjectId(req.body[i]._id));
                        }
                    }
                    favorites.save()
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                    .catch((err) => next(err));
                }
            } else {
                Favorites.create({user: req.user._id})
                .then((favorites) => {
                    for(var i = (req.body.length - 1); i >=0; i--){
                        favorites.dishes.push(mongoose.Types.ObjectId(req.body[i]._id));
                    }
                    favorites.save()
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                }, (err) => next(err))
                .catch((err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({})
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
        .catch((err) => next(err));
    });

//dishID routing for favorite
favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findById(req.params.dishId)
        .populate('user')
        .populate('dishes')
        .then((favorite) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorite);
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (dish != null) {
                console.log("dish: ", dish);
                Favorites.findOne({user: req.user._id})
                .then((favorites) => {
                    console.log("favorite: ", favorites);
                    if (favorites != null){
                        var exists = false;
                        for(var i = (favorites.dishes.length - 1); i >=0; i--){
                            if(favorites.dishes[i]._id == req.params.dishId){
                                exists = true;
                                break;
                            }
                        }
                        console.log("exists: ", exists);
                        if(exists){
                            err = new Error('Dish already in the list of favorites!');
                            err.status = 403;
                            next(err);
                        } else {
                            favorites.dishes.push(mongoose.Types.ObjectId(req.params.dishId));
                            favorites.save()
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            }, (err) => next(err))
                        }
                    } else {
                        Favorites.create({user: req.user._id})
                        .then((favorites) => {
                            favorites.dishes.push(mongoose.Types.ObjectId(req.params.dishId));
                            favorites.save()
                            .then((favorites) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorites);
                            }, (err) => next(err))
                        }, (err) => next(err))
                        .catch((err) => next(err));
                    }
                }, (err) => next(err))
                .catch((err) => next(err));
            }else {
                err = new Error('Dish ' + req.params.dishId + ' is not in the database.');
                err.status = 403;
                return next(err);
            }

        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Dishes.findById(req.params.dishId)
        .then((dish) => {
            if (dish != null) {
                console.log("dish: ", dish);
                Favorites.findOne({user: req.user._id})
                .then((favorites) => {
                    console.log("favorite: ", favorites);
                    if (favorites != null){
                        console.log("delete: ", favorites.dishes);
                        if(favorites.dishes.indexOf(req.params.dishId === -1)){
                            favorites.dishes.pop(req.params.dishId);
                            console.log("deleted! ", req.params.dishId);
                            favorites.save()
                            .then((favorite) => {
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'application/json');
                                res.json(favorite);
                            });
                        }
                    } else {
                        err = new Error('Favorite does not exist!');
                        err.status = 403;
                        next(err);
                    }
                }, (err) => next(err))
                .catch((err) => next(err));
            }else {
                err = new Error('Dish ' + req.params.dishId + ' is not in the database.');
                err.status = 404;
                return next(err);
            }

        }, (err) => next(err))
        .catch((err) => next(err));
    });

module.exports = favoriteRouter;