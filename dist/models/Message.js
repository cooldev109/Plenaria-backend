"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const MessageSchema = new mongoose_1.Schema({
    consultationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Consultation',
        required: [true, 'Consultation ID is required']
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender ID is required']
    },
    senderRole: {
        type: String,
        enum: ['customer', 'lawyer', 'admin'],
        required: [true, 'Sender role is required']
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [5000, 'Message content cannot exceed 5000 characters']
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'system'],
        default: 'text'
    },
    attachments: [{
            type: String,
            trim: true
        }],
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message'
    },
    editedAt: {
        type: Date
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});
MessageSchema.index({ consultationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1, consultationId: 1 });
MessageSchema.virtual('isUnread').get(function () {
    return !this.isRead;
});
exports.default = mongoose_1.default.model('Message', MessageSchema);
//# sourceMappingURL=Message.js.map