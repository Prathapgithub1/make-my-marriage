const stub = 'test-file-stub';
const mock = new String(stub);
Object.assign(mock, {
  __esModule: true,
  default: stub,
});
module.exports = mock;
