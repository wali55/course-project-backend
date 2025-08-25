const prisma = require("../config/database");

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          googleId: true,
          githubId: true,
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all users error", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    if (!["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (currentUser.id === userId && role === "USER") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "You cannot demote yourself. At least one admin is required",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: `User role updated successfully to ${role}`,
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    console.error("Update user role error", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    const target = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const willDeactivate = target.isActive === true;
    const willActivate = !willDeactivate;

    if (willActivate && target.role === "ADMIN") {
      const activeAdminCount = await prisma.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot deactivate the last active admin. At least one admin must remain active",
        });
      }
    }

    if (userId === currentUser.id && willActivate) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot reactive your own account. Another admin must do it",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !target.isActive },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.json({
      success: true,
      message: `User ${updatedUser.username} has been ${
        updatedUser.isActive ? "activated" : "deactivated"
      }`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Toggle user status error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

module.exports = { getAllUsers, updateUserRole, toggleUserStatus };
