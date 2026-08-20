/**
 * Role-based access control middleware
 * @param  {...string} roles Allowed roles (e.g. 'Admin', 'Manager', 'Student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before checking permissions",
      });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    const normalizedRoles = roles.map((role) => role.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Required role(s): ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = authorize;