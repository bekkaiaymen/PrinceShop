import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'غير مصرح لك بالدخول' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }
    
    if (!req.user.isActive) {
      return res.status(401).json({ message: 'حسابك معطل، تواصل مع الإدارة' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'غير مصرح لك بالدخول' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'ليس لديك صلاحية للقيام بهذا الإجراء' 
      });
    }
    next();
  };
};

export const affiliateOnly = restrictTo('affiliate');
export const adminOnly = restrictTo('admin');
