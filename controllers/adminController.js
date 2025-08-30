const prisma = require("../config/database");

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      status = "all",
      role = "all",
    } = req.query;

    const offset = (page - 1) * limit;

    const where = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status !== "all") {
      where.AND.push({
        isActive: status === "active",
      });
    }

    if (role !== "all") {
      where.AND.push({
        role: role.toUpperCase(),
      });
    }

    const finalWhere = where.AND.length > 0 ? where : {};

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: finalWhere,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          googleId: true,
          githubId: true,
        },
        skip: parseInt(offset),
        take: parseInt(limit),
        orderBy,
      }),
      prisma.user.count({ where: finalWhere }),
    ]);

    res.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        authMethod: user.googleId
          ? "google"
          : user.githubId
          ? "github"
          : "email",
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        sortBy,
        sortOrder,
        status,
        role,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

const bulkUserActions = async (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    let result;

    switch (action) {
      case "block":
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: { isActive: false },
        });
        break;

      case "unblock":
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
            id: { not: req.user.id },
          },
          data: { isActive: true },
        });
        break;

      case "delete":
        result = await prisma.user.deleteMany({
          where: {
            id: { in: userIds },
          },
        });
        break;

      case "makeAdmin":
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: { role: "ADMIN" },
        });
        break;

      case "removeAdmin":
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds },
          },
          data: { role: "USER" },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        });
    }

    res.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error("Bulk user actions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform bulk action",
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, adminUsers, inactiveUsers, recentUsers] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { isActive: false } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers,
        recentUsers,
        blockedUsers: inactiveUsers,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user statistics",
    });
  }
};

module.exports = {
  getAllUsers,
  bulkUserActions,
  getUserStats,
};
