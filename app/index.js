/**
 * Primary file for the API
 *
 */

// Dependecies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const fs = require('fs');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log(`The http server is listenting on port ${config.httpPort}`);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
  console.log(`The https server is listenting on port ${config.httpsPort}`);
});

// All the server logic for both the http and https server
const unifiedServer = (req, res) => {
  // Get URL and parse it
  const parsedURL = url.parse(req.url, true);

  // Get the path
  const path = parsedURL.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedURL.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found, use the notFound handler
    const chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer)
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // User the status code called back by the handler, or default to 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Use the payload callback by the handler, or default to an empty object
      payload = typeof payload === 'object' ? payload : {};

      // Convert the payload to a string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the requested
      console.log('Return this response: ', statusCode, payloadString);
    });
  });
};

// Define a request router
const router = {
  hello: handlers.hello,
  ping: handlers.ping,
  users: handlers.users
};
