const prisma = require("../config/database");
const {updateProfileSchema} = require("../utils/validation");

const getProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        })
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get profile"
        })
    }
}

const updateProfile = async (req, res) => {
    try {
        const {error, value} = updateProfileSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

        const {username} = value;
        const updateData = {};

        if (username && username !== req.user.username) {
            const existingUser = await prisma.user.findUnique({
                where: {username}
            })

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username is already taken"
                })
            }

            updateData.username = username
        }

        if (Object.keys(updateData).length > 0) {
            const updatedUser = await prisma.user.update({
                where: {id: req.user.id},
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            })

            res.json({
                success: true,
                message: "Profile updated successfully",
                user: updatedUser
            })
        } else {
            res.json({
                success: true,
                message: "No changes made",
                user: req.user
            })
        }
    } catch (error) {
        console.error("Update profile error", error);
        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        })
    }
}

module.exports = {
    getProfile,
    updateProfile
}