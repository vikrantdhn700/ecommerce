
let nonce = require('../nonce');

describe('Nonce-next', () => {

  // afterEach(() => {
  //   nonce.cache.reset();
  // });

  it ('should generate nonces when requested', () => {
    let nonce1 = nonce2 = undefined;

    nonce1 = nonce.generate();
    nonce2 = nonce.generate();

    expect(nonce1).toBeDefined();
    expect(nonce2).toBeDefined();

    expect(nonce1).toMatch(/\d{15}/);
    expect(nonce2).toMatch(/\d{15}/);

    expect(nonce1).not.toEqual(nonce2);
  });

  it ('should persist nonces to memory, to be avaiable between sessions', () => {
    expect(nonce.cache).toBeDefined();

    let n = nonce.generate();

    expect(nonce.cache.get(n)).toBeDefined();
  });

  it ('should compare nonces', () => {

    let n = nonce.generate();
    let notn = 111111111111;

    expect(nonce.compare(n)).toEqual(true);
    expect(nonce.compare(notn)).toEqual(false);

  });

  it ('should work with strings as well as numbers', () => {

    let n = nonce.generate();
    let sn = '' + n;

    expect(nonce.compare(sn)).toEqual(true);
  })

  it ('should remove nonces once compared', () => {
    let n = nonce.generate();

    expect(nonce.compare(n)).toEqual(true);
    expect(nonce.compare(n)).toEqual(false, 'should remove nonce after first comparison');

  });

  it ('should be able to remove nonces, returning them', () => {
    let n1 = nonce.generate();

    n2 = nonce.remove(n1);

    expect(n1).toEqual(n2, 'removed nonce should be equal')
    expect(nonce.compare(n1)).toEqual(false, 'nonce should be removed');
  });

  it ('should return false when removing something that does not exist', () => {
    expect(nonce.remove(111111111111)).toEqual(false);
  });

  it ('should be able to peek at nonces without removing them', () => {
    let n = nonce.generate();


    expect(nonce.peekCompare(n)).toEqual(true);
    expect(nonce.compare(n)).toEqual(true, 'should be true since peek does not remove nonce');

  });

  it ('should set an expiration date for nonces, invalidade expired', done => {
    let n = nonce.generate(500); // expires after 500ms

    expect(nonce.peekCompare(n)).toEqual(true);

    setTimeout(() => {
      expect(nonce.peekCompare(n)).toEqual(false);

      done();
    }, 750);
  });

  it ('should set an expiration from a properties object as well as a number', done => {

      let n = nonce.generate({
        expires: 500
      });

      expect(nonce.peekCompare(n)).toEqual(true);

      setTimeout(() => {
        expect(nonce.peekCompare(n)).toEqual(false);

        done();
      }, 750);
  })

  it ('should be able to be scoped with one or move values', () => {
    let n1 = nonce.generate({
      scope: 'a'
    });

    let n2 = nonce.generate({
      scope: ['a', 'b']
    });

    // fail with no scope
    expect(nonce.peekCompare(n1)).toEqual(false, 'No scope, expecting a');
    expect(nonce.peekCompare(n2)).toEqual(false, 'No scope, expecting [a, b]');

    // fail with wrong scope
    expect(nonce.peekCompare(n1, 'b')).toEqual(false, 'Wrong scope, expecting a, supplied b');
    expect(nonce.peekCompare(n2, 'a')).toEqual(false, 'Missing scope, expecting [a, b], supplied a');

    // succeed
    expect(nonce.peekCompare(n1, 'a')).toEqual(true);
    expect(nonce.peekCompare(n2, ['a', 'b'])).toEqual(true);
  })

});
