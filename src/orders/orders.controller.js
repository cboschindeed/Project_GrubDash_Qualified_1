const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: orders });
} // list

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
} // bodyDataHas

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
} // create

function validatePropertyNotEmptyString(propertyName) {
  return function (req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

    const propertyValue = { deliverTo, mobileNumber }[propertyName];

    if (propertyValue.trim() !== "") {
      return next();
    }

    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
} // validatePropertyNotEmptyString

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery"];

  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  if (validStatus.includes(status)) {
    return next();
  }

  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
} // statusPropertyIsValid

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (Array.isArray(dishes) && dishes.length > 0 && dishes.length !== 0) {
    return next();
  }

  next({ status: 400, message: "Order must include at least one dish" });
} // dishesPropertyIsValid

function dishQuantityPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let index = 0; index < dishes.length; index++) {
    const dish = dishes[index];
    const quantity = dish.quantity;

    if (
      quantity === undefined ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  return next();
} // dishQuantityPropertyIsValid

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const orderFound = orders.find((order) => order.id === orderId);

  if (orderFound) {
    res.locals.order = orderFound;
    return next();
  }

  next({ status: 404, message: `Order does not exist: ${orderId}.` });
} // dishExists

function read(req, res) {
  const order = res.locals.order;
  res.json({ data: order });
} // read

function idPropertyIsValid(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;

  if (!id || id === orderId) {
    return next();
  }

  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  });
} // idPropertyIsValid

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
} // update

function destroy(req, res) {
  const { data: { status } = {} } = req.body;

  if (status === "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id == orderId);

  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedPastes = pastes.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    validatePropertyNotEmptyString("deliverTo"),
    validatePropertyNotEmptyString("mobileNumber"),
    statusPropertyIsValid,
    dishesPropertyIsValid,
    dishQuantityPropertyIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    idPropertyIsValid,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    validatePropertyNotEmptyString("deliverTo"),
    validatePropertyNotEmptyString("mobileNumber"),
    statusPropertyIsValid,
    dishesPropertyIsValid,
    dishQuantityPropertyIsValid,
    update,
  ],
  delete: [orderExists, statusPropertyIsValid, destroy],
};
