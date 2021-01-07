const dotenv = require('dotenv').config();

const mongoose = require('mongoose');
// Read the .env file and load the environment variables in it into Node's process.env

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down the application...');
  console.error(err.name, err.message, err);
  process.exit(1);
});

const app = require('./app');

const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD
);

let server;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('successfully connected to database.');
    server = app.listen(PORT, () =>
      console.log(`server listening for incoming request on port ${PORT}.`)
    );
  })
  .catch((err) => {
    console.error('error connecting to the database!', err.name, err.message);
  });

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down the application...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
