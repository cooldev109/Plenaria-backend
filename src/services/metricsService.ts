import Consultation from '../models/Consultation';
import User from '../models/User';

/**
 * Calculate average response time for consultations
 * Response time = time from REQUESTED to ACCEPTED/REJECTED
 */
export const calculateAverageResponseTime = async (): Promise<number> => {
  try {
    const consultations = await Consultation.find({
      status: { $in: ['ACCEPTED', 'IN_PROGRESS', 'FINISHED'] },
      startAt: { $exists: true },
    }).select('createdAt startAt');

    if (consultations.length === 0) return 0;

    const totalResponseTime = consultations.reduce((sum, consultation) => {
      const responseTime = consultation.startAt!.getTime() - consultation.createdAt.getTime();
      return sum + responseTime;
    }, 0);

    // Return average in hours
    const averageMs = totalResponseTime / consultations.length;
    return Math.round((averageMs / 1000 / 60 / 60) * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error('Calculate average response time error:', error);
    return 0;
  }
};

/**
 * Get count of pending consultation requests
 */
export const getPendingConsultationsCount = async (): Promise<number> => {
  try {
    return await Consultation.countDocuments({
      status: 'REQUESTED',
    });
  } catch (error) {
    console.error('Get pending consultations count error:', error);
    return 0;
  }
};

/**
 * Get count of SLA breaches (consultations that exceeded responseBy deadline)
 */
export const getSlaBreachesCount = async (): Promise<number> => {
  try {
    const now = new Date();

    // Count REQUESTED consultations past their responseBy date
    const breaches = await Consultation.countDocuments({
      status: 'REQUESTED',
      responseBy: { $lt: now },
    });

    return breaches;
  } catch (error) {
    console.error('Get SLA breaches count error:', error);
    return 0;
  }
};

/**
 * Get consultation statistics by status
 */
export const getConsultationStats = async () => {
  try {
    const stats = await Consultation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: { [key: string]: number } = {
      REQUESTED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      IN_PROGRESS: 0,
      FINISHED: 0,
      CANCELLED: 0,
    };

    stats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    return statsMap;
  } catch (error) {
    console.error('Get consultation stats error:', error);
    return {};
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async () => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const statsMap: { [key: string]: number } = {
      admin: 0,
      lawyer: 0,
      customer: 0,
    };

    stats.forEach((stat) => {
      statsMap[stat._id] = stat.count;
    });

    // Get pending lawyers
    const pendingLawyers = await User.countDocuments({
      role: 'lawyer',
      status: 'PENDING',
    });

    // Get customers by plan
    const customerPlans = await User.aggregate([
      {
        $match: { role: 'customer' },
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
        },
      },
    ]);

    const planStats: { [key: string]: number } = {
      basic: 0,
      plus: 0,
      premium: 0,
    };

    customerPlans.forEach((stat) => {
      if (stat._id) {
        planStats[stat._id] = stat.count;
      }
    });

    return {
      byRole: statsMap,
      pendingLawyers,
      customersByPlan: planStats,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return {};
  }
};

/**
 * Get consultations over time (last 30 days)
 */
export const getConsultationsTrend = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trend = await Consultation.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1 },
      },
    ]);

    return trend.map((item) => ({
      date: item._id.date,
      count: item.count,
    }));
  } catch (error) {
    console.error('Get consultations trend error:', error);
    return [];
  }
};

/**
 * Get average session duration for finished consultations
 */
export const getAverageSessionDuration = async (): Promise<number> => {
  try {
    const consultations = await Consultation.find({
      status: 'FINISHED',
      sessionDuration: { $exists: true },
    }).select('sessionDuration');

    if (consultations.length === 0) return 0;

    const totalDuration = consultations.reduce((sum, consultation) => {
      return sum + (consultation.sessionDuration || 0);
    }, 0);

    return Math.round(totalDuration / consultations.length);
  } catch (error) {
    console.error('Get average session duration error:', error);
    return 0;
  }
};

/**
 * Get comprehensive metrics for admin dashboard
 */
export const getComprehensiveMetrics = async () => {
  try {
    const [
      averageResponseTime,
      pendingCount,
      slaBreaches,
      consultationStats,
      userStats,
      trend,
      avgSessionDuration,
    ] = await Promise.all([
      calculateAverageResponseTime(),
      getPendingConsultationsCount(),
      getSlaBreachesCount(),
      getConsultationStats(),
      getUserStats(),
      getConsultationsTrend(),
      getAverageSessionDuration(),
    ]);

    return {
      consultations: {
        averageResponseTimeHours: averageResponseTime,
        pendingCount,
        slaBreaches,
        byStatus: consultationStats,
        averageSessionDurationMinutes: avgSessionDuration,
        trend,
      },
      users: userStats,
    };
  } catch (error) {
    console.error('Get comprehensive metrics error:', error);
    throw error;
  }
};
