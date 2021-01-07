#! env /c/Program Files/nodejs/node

const fs = require('fs');

const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Read the .env file and load the environment variables in it into Node's process.env
dotenv.config({ path: '../../.env' });

const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const MONGODB_URI = process.env.MONGODB_URI.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD
);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('Successfully connected to database.');
  });

const displayUsage = () => {
  console.log(`
    Usage: "node import-dev-data.js [--delete | --import | --load] [path-to-tours-data]"

    Options:
      --import | --delete: Load or Import new tours data into the database.
      --delete: Delete all existing tours data currently in the database.
  `);
  process.exit(0);
};

const checkFile = (filePath) => {
  try {
    if (!fs.statSync(filePath).isFile()) {
      console.error('Please provide a valid file path/name');
    }
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (error) {
    console.error(
      'unable to read file!, Please provide a valid file path/name'
    );
    displayUsage();
  }
};

const importData = async () => {
  if (
    (process.argv[2] === '--load' || process.argv[2] === '--import') &&
    !process.argv[3]
  ) {
    displayUsage();
  }
  const filePath = `${__dirname}/${process.argv[3]}`;
  checkFile(filePath);
  const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  try {
    switch (process.argv[3].split('.')[0]) {
      case 'tours':
        await Tour.create(fileData);
        console.log('successfully loaded tours data.');
        break;
      case 'users':
        await User.create(fileData, { validateBeforeSave: false });
        console.log('successfully loaded users data.');
        break;
      case 'reviews':
        await Review.create(fileData);
        console.log('successfully loaded reviews data.');
        break;
      default:
        displayUsage();
    }
  } catch (err) {
    console.log('error loading data', err);
  } finally {
    process.exit(0);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('successfully deleted all resource data');
  } catch (error) {
    console.log('error deleting tours data');
  } finally {
    process.exit(0);
  }
};

if (process.argv[2] === '--import' || process.argv[2] === '--load') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  displayUsage();
}

// Tour.insertMany(toursData)
//   .then(() => {
//     console.log('Successfully Inserted batch tours data');
//   })
//   .catch((error) => {
//     console.log('Error inserting batch tour data...', error);
//   })
//   .finally(() => {
//     process.exit(0);
//   });
