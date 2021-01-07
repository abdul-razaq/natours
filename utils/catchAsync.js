// function that basically accepts a handler function, invokes it and catch the error that the handler function returns.
module.exports = (handler) => {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
};
