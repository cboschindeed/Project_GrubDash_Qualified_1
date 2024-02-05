const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
} // list

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
} // bodyDataHas

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
} // create

function validatePropertyNotEmptyString(propertyName) {
  return function (req, res, next) {
    const { data: { name, description, image_url } = {} } = req.body;

    const propertyValue = { name, description, image_url }[propertyName];

    if (propertyValue.trim() !== "") {
      return next();
    }

    next({ status: 400, message: `Dish must include ${propertyName}` });
  };
} // validatePropertyNotEmptyString

function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price > 0 && Number.isInteger(price)) {
    return next();
  }

  next({
    status: 400,
    message: "Dish must have a price that is an integer greater than 0",
  });
} // priceIsValidNumber

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const dishFound = dishes.find((dish) => dish.id === dishId);

  if (dishFound) {
    res.locals.dish = dishFound;
    return next();
  }

  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
} // dishExists

function read(req, res) {
  const dish = res.locals.dish;
  res.json({ data: dish });
} // read

function idPropertyIsValid(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;

  if (!id || id === dishId) {
    return next();
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
} // idPropertyIsValid

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
} // update

module.exports = {
  list,
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validatePropertyNotEmptyString("name"),
    validatePropertyNotEmptyString("description"),
    priceIsValidNumber,
    validatePropertyNotEmptyString("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    idPropertyIsValid,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    validatePropertyNotEmptyString("name"),
    validatePropertyNotEmptyString("description"),
    priceIsValidNumber,
    validatePropertyNotEmptyString("image_url"),
    update,
  ],
};
