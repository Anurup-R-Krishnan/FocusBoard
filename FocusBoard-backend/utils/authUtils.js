import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const getUserIdFromRequest = (req) => {
  if (req.user && req.user.id) {
    return req.user.id;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    return decoded?.id || null;
  } catch (error) {
    return null;
  }
};

export { getUserIdFromRequest };
