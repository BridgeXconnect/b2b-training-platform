/**
 * Jest Polyfills for Voice Practice Interface Testing
 * Browser API polyfills and additional security measures
 */

// TextEncoder/TextDecoder polyfill for Node.js
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for AbortController
if (typeof global.AbortController === 'undefined') {
  global.AbortController = class AbortController {
    constructor() {
      this.signal = {
        aborted: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      };
    }
    
    abort() {
      this.signal.aborted = true;
    }
  };
}

// Polyfill for ReadableStream
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(source) {
      this.source = source;
    }
    
    getReader() {
      return {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        releaseLock: jest.fn(),
        cancel: jest.fn()
      };
    }
    
    cancel() {
      return Promise.resolve();
    }
  };
}

// Polyfill for Headers
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.headers = new Map();
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.set(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }
    
    append(name, value) {
      const existing = this.headers.get(name.toLowerCase());
      this.headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
    }
    
    delete(name) {
      this.headers.delete(name.toLowerCase());
    }
    
    get(name) {
      return this.headers.get(name.toLowerCase()) || null;
    }
    
    has(name) {
      return this.headers.has(name.toLowerCase());
    }
    
    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }
    
    forEach(callback) {
      this.headers.forEach((value, key) => callback(value, key, this));
    }
    
    keys() {
      return this.headers.keys();
    }
    
    values() {
      return this.headers.values();
    }
    
    entries() {
      return this.headers.entries();
    }
    
    [Symbol.iterator]() {
      return this.headers.entries();
    }
  };
}

// Polyfill for Request
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || 'about:client';
      this.mode = init.mode || 'cors';
      
      // Security check: Ensure no API keys in request
      const requestData = JSON.stringify({
        url: this.url,
        headers: Array.from(this.headers.entries()),
        body: this.body
      });
      
      if (requestData.match(/sk-[a-zA-Z0-9]{48}/)) {
        throw new Error('API key detected in Request object - Security violation');
      }
    }
    
    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
        credentials: this.credentials,
        cache: this.cache,
        redirect: this.redirect,
        referrer: this.referrer,
        mode: this.mode
      });
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
    
    json() {
      return Promise.resolve({});
    }
    
    text() {
      return Promise.resolve('');
    }
    
    formData() {
      return Promise.resolve(new FormData());
    }
  };
}

// Polyfill for Response
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.redirected = false;
      this.type = 'basic';
      this.url = '';
    }
    
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(0));
    }
    
    json() {
      return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
    }
    
    text() {
      return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
    }
    
    formData() {
      return Promise.resolve(new FormData());
    }
    
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      });
    }
    
    static error() {
      const response = new Response(null, { status: 0 });
      response.ok = false;
      response.type = 'error';
      return response;
    }
    
    static redirect(url, status = 302) {
      return new Response(null, {
        status,
        headers: { Location: url }
      });
    }
  };
}

// Polyfill for FormData
if (typeof global.FormData === 'undefined') {
  global.FormData = class FormData {
    constructor() {
      this.data = new Map();
    }
    
    append(name, value, filename) {
      if (!this.data.has(name)) {
        this.data.set(name, []);
      }
      this.data.get(name).push({ value, filename });
    }
    
    delete(name) {
      this.data.delete(name);
    }
    
    get(name) {
      const values = this.data.get(name);
      return values ? values[0].value : null;
    }
    
    getAll(name) {
      const values = this.data.get(name);
      return values ? values.map(item => item.value) : [];
    }
    
    has(name) {
      return this.data.has(name);
    }
    
    set(name, value, filename) {
      this.data.set(name, [{ value, filename }]);
    }
    
    forEach(callback) {
      this.data.forEach((values, key) => {
        values.forEach(item => callback(item.value, key, this));
      });
    }
    
    keys() {
      return this.data.keys();
    }
    
    values() {
      const result = [];
      this.data.forEach(values => {
        values.forEach(item => result.push(item.value));
      });
      return result[Symbol.iterator]();
    }
    
    entries() {
      const result = [];
      this.data.forEach((values, key) => {
        values.forEach(item => result.push([key, item.value]));
      });
      return result[Symbol.iterator]();
    }
    
    [Symbol.iterator]() {
      return this.entries();
    }
    
    toString() {
      // Security check: Ensure no API keys in FormData
      const formDataString = Array.from(this.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      if (formDataString.match(/sk-[a-zA-Z0-9]{48}/)) {
        throw new Error('API key detected in FormData - Security violation');
      }
      
      return formDataString;
    }
  };
}

// Polyfill for File
if (typeof global.File === 'undefined') {
  global.File = class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified || Date.now();
      this.webkitRelativePath = '';
    }
  };
}

// Polyfill for FileReader
if (typeof global.FileReader === 'undefined') {
  global.FileReader = class FileReader {
    constructor() {
      this.readyState = 0; // EMPTY
      this.result = null;
      this.error = null;
      this.onload = null;
      this.onerror = null;
      this.onloadend = null;
      this.onloadstart = null;
      this.onprogress = null;
    }
    
    readAsArrayBuffer(blob) {
      this.readyState = 1; // LOADING
      setTimeout(() => {
        this.result = new ArrayBuffer(8);
        this.readyState = 2; // DONE
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }, 10);
    }
    
    readAsText(blob) {
      this.readyState = 1; // LOADING
      setTimeout(() => {
        this.result = 'mock file content';
        this.readyState = 2; // DONE
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }, 10);
    }
    
    readAsDataURL(blob) {
      this.readyState = 1; // LOADING
      setTimeout(() => {
        this.result = 'data:audio/webm;base64,mock-data';
        this.readyState = 2; // DONE
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }, 10);
    }
    
    abort() {
      this.readyState = 2; // DONE
      if (this.onloadend) this.onloadend({ target: this });
    }
  };
}

// Polyfill for crypto.getRandomValues
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };
}

// Polyfill for AudioContext
if (typeof global.AudioContext === 'undefined') {
  global.AudioContext = class AudioContext {
    constructor() {
      this.state = 'running';
      this.sampleRate = 44100;
      this.destination = {
        connect: jest.fn()
      };
      this.listener = {
        setPosition: jest.fn(),
        setOrientation: jest.fn()
      };
    }
    
    createAnalyser() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        fftSize: 2048,
        frequencyBinCount: 1024,
        getFloatFrequencyData: jest.fn(),
        getByteFrequencyData: jest.fn()
      };
    }
    
    createOscillator() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 440 },
        type: 'sine'
      };
    }
    
    createGain() {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
        gain: { value: 1 }
      };
    }
    
    createMediaStreamSource(stream) {
      return {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
    }
    
    close() {
      return Promise.resolve();
    }
    
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    
    suspend() {
      this.state = 'suspended';
      return Promise.resolve();
    }
  };
  
  // Alias for webkit
  global.webkitAudioContext = global.AudioContext;
}

// Polyfill for MediaStream
if (typeof global.MediaStream === 'undefined') {
  global.MediaStream = class MediaStream {
    constructor(tracks = []) {
      this.tracks = tracks;
      this.id = crypto.randomUUID();
      this.active = true;
    }
    
    getTracks() {
      return this.tracks;
    }
    
    getAudioTracks() {
      return this.tracks.filter(track => track.kind === 'audio');
    }
    
    getVideoTracks() {
      return this.tracks.filter(track => track.kind === 'video');
    }
    
    addTrack(track) {
      this.tracks.push(track);
    }
    
    removeTrack(track) {
      const index = this.tracks.indexOf(track);
      if (index !== -1) {
        this.tracks.splice(index, 1);
      }
    }
    
    clone() {
      return new MediaStream(this.tracks.map(track => track.clone()));
    }
  };
}

// Security validation for all polyfills
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(obj, prop, descriptor) {
  // Check if we're trying to set an API key
  if (typeof descriptor.value === 'string' && descriptor.value.match(/sk-[a-zA-Z0-9]{48}/)) {
    throw new Error(`API key detected in Object.defineProperty for ${prop} - Security violation`);
  }
  
  return originalDefineProperty.call(this, obj, prop, descriptor);
};

// Console security wrapper
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const secureConsoleWrapper = (originalMethod, methodName) => {
  return function(...args) {
    // Check all arguments for API key exposure
    args.forEach(arg => {
      const argString = typeof arg === 'string' ? arg : JSON.stringify(arg);
      if (argString && argString.match(/sk-[a-zA-Z0-9]{48}/)) {
        throw new Error(`API key detected in console.${methodName} - Security violation`);
      }
    });
    
    return originalMethod.apply(console, args);
  };
};

console.log = secureConsoleWrapper(originalConsoleLog, 'log');
console.error = secureConsoleWrapper(originalConsoleError, 'error');
console.warn = secureConsoleWrapper(originalConsoleWarn, 'warn');

// Global error handler for security violations
process.on('uncaughtException', (error) => {
  if (error.message.includes('Security violation')) {
    console.error('🚨 SECURITY VIOLATION DETECTED:', error.message);
    process.exit(1);
  }
});