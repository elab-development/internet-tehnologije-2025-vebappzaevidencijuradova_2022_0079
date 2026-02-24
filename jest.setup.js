// Učitavamo neophodne polyfill-ove za Request, Response i Fetch
const { TextEncoder, TextDecoder } = require('util');
const { Request, Response, Headers, fetch } = require('undici');

// Postavljamo ih u globalni opseg da bi Next.js server-side kod mogao da ih vidi
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;

// Opciono: Ignoriši specifične warninge u konzoli tokom testova
console.error = jest.fn();