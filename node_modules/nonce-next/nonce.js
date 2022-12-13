let n = require('nonce')();
let LRU = require("lru-cache");


let cache = LRU({
  maxAge: 1000 * 60 * 60 * 24 // 1 day
});


let nn = {
  cache: cache,

  generate: function(props) {

    // exipiration
    let maxAge = false;
    if (!!props && typeof props == 'number') {
      maxAge = props;
    } else if (!!props && !!props.expires) {
      maxAge = props.expires;
    }

    // scope
    let scope = true;
    if (!!props && !!props.scope) {
      if (!Array.isArray(props.scope)) { props.scope = [props.scope]; }
      scope = props.scope.join('');
    }

    // create nonce, set to cache
    let nonce = '' +  n();
    if (maxAge) {
      cache.set('' + nonce, scope, maxAge);
    } else {
      cache.set('' + nonce, scope);
    }
    return nonce;
  },

  peekCompare: function(nonce, scope) {
    let value = cache.get('' + nonce);

    // compare against scope
    if (typeof value == 'string') {
      if (!!scope) {
        if (!Array.isArray(scope)) { scope = [scope]; }
        return value == scope.join('');
      } else {
        return false;
      }
    }

    // compare against value
    return !!value;
  },

  compare: function(nonce) {
    let valid = nn.peekCompare(nonce);
    if (valid) { cache.del('' + nonce); }
    return valid;
  },

  remove: function(nonce) {
    let valid = !!cache.get('' + nonce);
    if (!valid) { return false };
    cache.del('' + nonce);
    return nonce;
  }
};

module.exports = nn;
