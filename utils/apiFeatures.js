module.exports = class {
  constructor(query, queryObject) {
    this.query = query;
    this.queryObject = queryObject;
  }

  filter() {
    // FILTERING AND ADVANCED FILTERING
    let queryObj = { ...this.queryObject };
    const excludedFields = ['sort', 'page', 'fields', 'limit'];

    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    let queryObjString = JSON.stringify(queryObj);
    queryObjString = queryObjString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    queryObj = JSON.parse(queryObjString);
    this.query = this.query.find(queryObj);
    return this;
  }

  sort() {
    // SORTING
    this.query = this.query.sort(
      this.queryObject.sort
        ? this.queryObject.sort.split(',').join(' ')
        : '-createdAt'
    );
    return this;
  }

  limitFields() {
    // FIELD LIMITING
    this.query = this.query.select(
      this.queryObject.fields
        ? this.queryObject.fields.split(',').join(' ')
        : '-__v'
    );
    return this;
  }

  paginate() {
    // PAGINATION
    const page = +this.queryObject.page || 1;
    const limit = +this.queryObject.limit || 100;
    const offset = (page - 1) * limit;
    this.query = this.query.skip(offset).limit(limit);
    return this;
  }
};
