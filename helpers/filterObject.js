module.exports = (obj, ...props) => {
  let filteredObj = {};
  for (const key of Object.keys(obj)) {
    if (props.includes(key)) {
      filteredObj[key] = obj[key];
    }
  }
  return filteredObj;
};
