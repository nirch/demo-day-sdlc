jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

const errorHandler = require('../middleware/errorHandler');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const req = { path: '/api/test', method: 'GET' };

describe('errorHandler', () => {
  it('uses err.status and returns { data: null, error: message }', () => {
    const err = new Error('Not found');
    err.status = 404;
    const res = makeRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'Not found' });
  });

  it('returns 500 when the error has no status', () => {
    const res = makeRes();

    errorHandler(new Error('boom'), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ data: null, error: 'boom' });
  });
});
