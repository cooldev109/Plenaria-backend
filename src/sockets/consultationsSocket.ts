import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/auth';
import Consultation from '../models/Consultation';
import Message from '../models/Message';
import User from '../models/User';

// Session constants
const MAX_SESSION_DURATION_MS = 60 * 60 * 1000; // 60 minutes

// Active sessions tracking
const activeSessions: Map<
  string,
  {
    consultationId: string;
    startTime: number;
    maxEndTime: number;
    lastActivity?: number;
    idleTimer?: NodeJS.Timeout;
    sessionTimer?: NodeJS.Timeout;
  }
> = new Map();

/**
 * Setup consultations namespace with Socket.IO
 */
export const setupConsultationsSocket = (io: Server) => {
  const consultationsNamespace = io.of('/consultations');

  // Authentication middleware
  consultationsNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      (socket as any).user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  consultationsNamespace.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.warn(`[SOCKET] User connected: ${user.email} (${user.role})`);

    /**
     * Join a consultation room
     */
    socket.on('join_consultation', async (data: string | { consultationId: string }) => {
      try {
        const consultationId = typeof data === 'string' ? data : data.consultationId;

        const consultation = await Consultation.findById(consultationId)
          .populate('customerId')
          .populate('lawyerId');

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Check access
        const isCustomer = consultation.customerId._id.toString() === user._id.toString();
        const isLawyer = consultation.lawyerId?._id.toString() === user._id.toString();

        if (!isCustomer && !isLawyer && user.role !== 'admin') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(consultationId);
        socket.emit('joined_consultation', { consultationId });
        console.warn(`[SOCKET] User ${user.email} joined consultation ${consultationId}`);

        // Notify others in the room
        socket.to(consultationId).emit('user_joined', {
          userId: user._id,
          email: user.email,
          role: user.role,
        });
      } catch (error) {
        console.error('[SOCKET] Join consultation error:', error);
        socket.emit('error', { message: 'Failed to join consultation' });
      }
    });

    /**
     * Lawyer accepts a consultation request
     */
    socket.on('accept_consultation', async (consultationId: string) => {
      try {
        if (user.role !== 'lawyer') {
          socket.emit('error', { message: 'Only lawyers can accept consultations' });
          return;
        }

        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        if (consultation.status !== 'REQUESTED') {
          socket.emit('error', { message: 'Consultation already handled' });
          return;
        }

        // Accept consultation
        consultation.status = 'IN_PROGRESS';
        consultation.lawyerId = user._id as any;
        consultation.startAt = new Date();
        consultation.lastActivityAt = new Date();
        await consultation.save();

        await consultation.populate('customerId lawyerId');

        // Start session timers
        startSessionTimers(consultationId, consultationsNamespace);

        // Notify both parties
        consultationsNamespace.to(consultationId).emit('consultation_accepted', {
          consultation,
          message: 'Consultation has been accepted',
        });

        console.warn(`[SOCKET] Lawyer ${user.email} accepted consultation ${consultationId}`);
      } catch (error) {
        console.error('[SOCKET] Accept consultation error:', error);
        socket.emit('error', { message: 'Failed to accept consultation' });
      }
    });

    /**
     * Lawyer rejects a consultation request
     */
    socket.on('reject_consultation', async ({ consultationId, reason }: { consultationId: string; reason?: string }) => {
      try {
        if (user.role !== 'lawyer') {
          socket.emit('error', { message: 'Only lawyers can reject consultations' });
          return;
        }

        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        if (consultation.status !== 'REQUESTED') {
          socket.emit('error', { message: 'Consultation already handled' });
          return;
        }

        // Reject consultation
        consultation.status = 'REJECTED';
        consultation.lawyerId = user._id as any;
        consultation.rejectionReason = reason;
        await consultation.save();

        await consultation.populate('customerId lawyerId');

        // Notify customer
        consultationsNamespace.to(consultationId).emit('consultation_rejected', {
          consultation,
          reason,
        });

        console.warn(`[SOCKET] Lawyer ${user.email} rejected consultation ${consultationId}`);
      } catch (error) {
        console.error('[SOCKET] Reject consultation error:', error);
        socket.emit('error', { message: 'Failed to reject consultation' });
      }
    });

    /**
     * Send a message in a consultation
     */
    socket.on('send_message', async ({ consultationId, text, content, attachments = [] }: { consultationId: string; text?: string; content?: string; attachments?: string[] }) => {
      try {
        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Check if session is active
        if (consultation.status !== 'IN_PROGRESS' && consultation.status !== 'ACCEPTED') {
          socket.emit('error', { message: 'Consultation is not active' });
          return;
        }

        // Support both text and content fields
        const messageText = text || content || '';

        if (!messageText.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Create message
        const message = await Message.create({
          consultationId,
          senderId: user._id,
          text: messageText,
          attachments,
          deliveredAt: new Date(),
        });

        await message.populate('senderId', 'email role');

        // Update last activity
        consultation.lastActivityAt = new Date();
        await consultation.save();

        // Reset idle timer if session is in progress
        if (consultation.status === 'IN_PROGRESS') {
          resetIdleTimer(consultationId, consultationsNamespace);
        }

        // Transform message to match frontend format
        const transformedMessage = {
          _id: message._id,
          consultation: message.consultationId,
          sender: (message as any).senderId,
          content: message.text,
          isRead: !!message.readAt,
          createdAt: message.createdAt,
        };

        // Broadcast message to room
        consultationsNamespace.to(consultationId).emit('new_message', transformedMessage);

        // Send delivery receipt
        socket.emit('message_delivered', {
          messageId: message._id,
          deliveredAt: message.deliveredAt,
        });

        console.warn(`[SOCKET] Message sent in consultation ${consultationId} by ${user.email}`);
      } catch (error) {
        console.error('[SOCKET] Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * End consultation early (customer can end anytime)
     */
    socket.on('end_consultation', async (data: string | { consultationId: string }) => {
      try {
        const consultationId = typeof data === 'string' ? data : data.consultationId;

        const consultation = await Consultation.findById(consultationId);

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Only customer or lawyer can end
        const isCustomer = consultation.customerId.toString() === user._id.toString();
        const isLawyer = consultation.lawyerId?.toString() === user._id.toString();

        if (!isCustomer && !isLawyer && user.role !== 'admin') {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        if (consultation.status !== 'IN_PROGRESS') {
          socket.emit('error', { message: 'Consultation is not active' });
          return;
        }

        // End session
        await endSession(consultationId, 'User ended session', consultationsNamespace);
        console.warn(`[SOCKET] User ${user.email} ended consultation ${consultationId}`);
      } catch (error) {
        console.error('[SOCKET] End consultation error:', error);
        socket.emit('error', { message: 'Failed to end consultation' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', ({ consultationId }: { consultationId: string }) => {
      socket.to(consultationId).emit('user_typing', {
        userId: user._id,
        email: user.email,
      });
    });

    /**
     * Stopped typing indicator
     */
    socket.on('stopped_typing', ({ consultationId }: { consultationId: string }) => {
      socket.to(consultationId).emit('user_stopped_typing', {
        userId: user._id,
        email: user.email,
      });
    });

    /**
     * Leave consultation room
     */
    socket.on('leave_consultation', (data: string | { consultationId: string }) => {
      const consultationId = typeof data === 'string' ? data : data.consultationId;

      socket.leave(consultationId);
      socket.to(consultationId).emit('user_left', {
        userId: user._id,
        email: user.email,
      });
      console.warn(`[SOCKET] User ${user.email} left consultation ${consultationId}`);
    });

    socket.on('disconnect', () => {
      console.warn(`[SOCKET] User disconnected: ${user.email}`);
    });
  });

  return consultationsNamespace;
};

/**
 * Start session timers (60 min max, 10 min idle) - for display only, no auto-close
 */
function startSessionTimers(consultationId: string, _namespace: any) {
  // Clear existing timers if any
  clearSessionTimers(consultationId);

  const now = Date.now();
  const maxEndTime = now + MAX_SESSION_DURATION_MS;

  // Store session info without auto-close timers
  // Timers are for display purposes only - customer controls when to end
  activeSessions.set(consultationId, {
    consultationId,
    startTime: now,
    maxEndTime,
  });

  console.warn(`[TIMER] Started session tracking for consultation ${consultationId} (no auto-close)`);
}

/**
 * Reset idle timer on activity - now just updates last activity time
 */
function resetIdleTimer(consultationId: string, _namespace: any) {
  // Just track activity, no auto-close
  const session = activeSessions.get(consultationId);
  if (session) {
    // Update last activity timestamp in session tracking
    activeSessions.set(consultationId, {
      ...session,
      lastActivity: Date.now(),
    });
  }
}

/**
 * Clear session timers/tracking
 */
function clearSessionTimers(consultationId: string) {
  const session = activeSessions.get(consultationId);

  if (session) {
    // No timers to clear anymore, just remove from tracking
    activeSessions.delete(consultationId);
  }
}

/**
 * End a consultation session
 */
async function endSession(consultationId: string, reason: string, namespace: any) {
  try {
    const consultation = await Consultation.findById(consultationId);

    if (!consultation || consultation.status !== 'IN_PROGRESS') {
      return;
    }

    // Calculate session duration
    const startTime = consultation.startAt?.getTime() || Date.now();
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    // Update consultation
    consultation.status = 'FINISHED';
    consultation.endAt = new Date();
    consultation.sessionDuration = durationMinutes;
    await consultation.save();

    // Clear timers
    clearSessionTimers(consultationId);

    // Determine the reason type
    const reasonType = reason.includes('inactivity') ? 'idle' :
                      reason.includes('duration') ? 'timeout' : 'manual';

    // Notify all participants
    namespace.to(consultationId).emit('session_ended', {
      consultationId,
      reason: reasonType,
      message: reason,
      duration: durationMinutes,
    });

    console.warn(`[TIMER] Consultation ${consultationId} ended: ${reason} (${durationMinutes} minutes)`);
  } catch (error) {
    console.error('[TIMER] End session error:', error);
  }
}
