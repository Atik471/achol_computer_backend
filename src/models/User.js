import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter your name"],
            trim: true,
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            unique: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: [true, "Please enter a password"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Never return password in queries
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        avatar: {
            public_id: String,
            url: String,
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        isVerified: {
            type: Boolean,
            default: false,
        },
        shippingAddress: {
            address: String,
            city: String,
            postalCode: String,
            country: String,
        },
        phone: {
            type: String,
            maxlength: [20, "Phone number cannot exceed 20 characters"],
        },
        sku: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        refreshToken: {
            type: String,
        }
    },
    { timestamps: true }
);

// **Hash password before saving**
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_ACCESS_SECRET, // stronger secret just for access
        { expiresIn: "15m" } // short-lived
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_REFRESH_SECRET, // separate secret
        { expiresIn: "30d" } // long-lived
    );
};

// **Compare passwords**
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// **Generate password reset token**
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;