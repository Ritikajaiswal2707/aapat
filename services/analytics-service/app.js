const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const socketIo = require('socket.io');
const http = require('http');
const redis = require('redis');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'aapat_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'aapat_db',
  password: process.env.DB_PASSWORD || 'aapat_password',
  port: process.env.DB_PORT || 5432,
});

// Redis connection
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// Analytics metrics collection
class AnalyticsCollector {
  static async collectResponseTimeMetrics() {
    try {
      const query = `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (actual_arrival - created_at))/60) as avg_response_time,
          COUNT(*) as total_emergencies,
          COUNT(CASE WHEN priority_level = 1 THEN 1 END) as critical_count,
          COUNT(CASE WHEN priority_level = 2 THEN 1 END) as high_count,
          COUNT(CASE WHEN priority_level = 3 THEN 1 END) as medium_count,
          COUNT(CASE WHEN priority_level = 4 THEN 1 END) as low_count
        FROM emergency_requests 
        WHERE status = 'COMPLETED' 
          AND actual_arrival IS NOT NULL
          AND created_at >= NOW() - INTERVAL '24 hours'
      `;
      
      const result = await pool.query(query);
      const metrics = result.rows[0];
      
      // Store in analytics_metrics table
      await pool.query(`
        INSERT INTO analytics_metrics (metric_type, metric_value, metric_unit, time_period, recorded_at)
        VALUES 
          ('avg_response_time', $1, 'minutes', 'daily', NOW()),
          ('total_emergencies', $2, 'count', 'daily', NOW()),
          ('critical_emergencies', $3, 'count', 'daily', NOW()),
          ('high_emergencies', $4, 'count', 'daily', NOW()),
          ('medium_emergencies', $5, 'count', 'daily', NOW()),
          ('low_emergencies', $6, 'count', 'daily', NOW())
      `, [
        metrics.avg_response_time || 0,
        metrics.total_emergencies || 0,
        metrics.critical_count || 0,
        metrics.high_count || 0,
        metrics.medium_count || 0,
        metrics.low_count || 0
      ]);
      
      console.log('Response time metrics collected');
    } catch (error) {
      console.error('Error collecting response time metrics:', error);
    }
  }
  
  static async collectAmbulanceUtilizationMetrics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_ambulances,
          COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_ambulances,
          COUNT(CASE WHEN status = 'ASSIGNED' THEN 1 END) as assigned_ambulances,
          COUNT(CASE WHEN status = 'ON_ROUTE' THEN 1 END) as on_route_ambulances,
          COUNT(CASE WHEN status = 'AT_PATIENT' THEN 1 END) as at_patient_ambulances,
          COUNT(CASE WHEN status = 'TRANSPORTING' THEN 1 END) as transporting_ambulances
        FROM ambulances 
        WHERE is_active = true
      `;
      
      const result = await pool.query(query);
      const metrics = result.rows[0];
      
      const utilizationPercentage = metrics.total_ambulances > 0 ? 
        ((metrics.total_ambulances - metrics.available_ambulances) / metrics.total_ambulances * 100) : 0;
      
      await pool.query(`
        INSERT INTO analytics_metrics (metric_type, metric_value, metric_unit, time_period, recorded_at)
        VALUES 
          ('ambulance_utilization', $1, 'percentage', 'daily', NOW()),
          ('total_ambulances', $2, 'count', 'daily', NOW()),
          ('available_ambulances', $3, 'count', 'daily', NOW()),
          ('active_ambulances', $4, 'count', 'daily', NOW())
      `, [
        utilizationPercentage,
        metrics.total_ambulances || 0,
        metrics.available_ambulances || 0,
        (metrics.assigned_ambulances + metrics.on_route_ambulances + 
         metrics.at_patient_ambulances + metrics.transporting_ambulances) || 0
      ]);
      
      console.log('Ambulance utilization metrics collected');
    } catch (error) {
      console.error('Error collecting ambulance utilization metrics:', error);
    }
  }
  
  static async collectHospitalCapacityMetrics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_hospitals,
          SUM(total_beds) as total_beds,
          SUM(available_beds) as available_beds,
          SUM(icu_beds) as total_icu_beds,
          SUM(available_icu_beds) as available_icu_beds
        FROM hospitals 
        WHERE is_active = true
      `;
      
      const result = await pool.query(query);
      const metrics = result.rows[0];
      
      const bedUtilization = metrics.total_beds > 0 ? 
        ((metrics.total_beds - metrics.available_beds) / metrics.total_beds * 100) : 0;
      
      const icuUtilization = metrics.total_icu_beds > 0 ? 
        ((metrics.total_icu_beds - metrics.available_icu_beds) / metrics.total_icu_beds * 100) : 0;
      
      await pool.query(`
        INSERT INTO analytics_metrics (metric_type, metric_value, metric_unit, time_period, recorded_at)
        VALUES 
          ('hospital_bed_utilization', $1, 'percentage', 'daily', NOW()),
          ('hospital_icu_utilization', $2, 'percentage', 'daily', NOW()),
          ('total_hospitals', $3, 'count', 'daily', NOW()),
          ('total_beds', $4, 'count', 'daily', NOW()),
          ('available_beds', $5, 'count', 'daily', NOW())
      `, [
        bedUtilization,
        icuUtilization,
        metrics.total_hospitals || 0,
        metrics.total_beds || 0,
        metrics.available_beds || 0
      ]);
      
      console.log('Hospital capacity metrics collected');
    } catch (error) {
      console.error('Error collecting hospital capacity metrics:', error);
    }
  }
  
  static async collectFinancialMetrics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_bills,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_bill_amount,
          COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_bills,
          SUM(CASE WHEN payment_status = 'PAID' THEN amount ELSE 0 END) as paid_revenue,
          SUM(insurance_covered) as total_insurance_covered
        FROM billing 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `;
      
      const result = await pool.query(query);
      const metrics = result.rows[0];
      
      const collectionRate = metrics.total_bills > 0 ? 
        (metrics.paid_bills / metrics.total_bills * 100) : 0;
      
      await pool.query(`
        INSERT INTO analytics_metrics (metric_type, metric_value, metric_unit, time_period, recorded_at)
        VALUES 
          ('daily_revenue', $1, 'rupees', 'daily', NOW()),
          ('avg_bill_amount', $2, 'rupees', 'daily', NOW()),
          ('collection_rate', $3, 'percentage', 'daily', NOW()),
          ('total_bills', $4, 'count', 'daily', NOW()),
          ('insurance_covered', $5, 'rupees', 'daily', NOW())
      `, [
        metrics.total_revenue || 0,
        metrics.avg_bill_amount || 0,
        collectionRate,
        metrics.total_bills || 0,
        metrics.total_insurance_covered || 0
      ]);
      
      console.log('Financial metrics collected');
    } catch (error) {
      console.error('Error collecting financial metrics:', error);
    }
  }
}

// Get dashboard metrics
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '1h':
        timeFilter = "AND recorded_at >= NOW() - INTERVAL '1 hour'";
        break;
      case '24h':
        timeFilter = "AND recorded_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "AND recorded_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND recorded_at >= NOW() - INTERVAL '30 days'";
        break;
    }
    
    const query = `
      SELECT 
        metric_type,
        AVG(metric_value) as avg_value,
        MAX(metric_value) as max_value,
        MIN(metric_value) as min_value
      FROM analytics_metrics 
      WHERE time_period = 'daily' ${timeFilter}
      GROUP BY metric_type
    `;
    
    const result = await pool.query(query);
    
    const metrics = {};
    result.rows.forEach(row => {
      metrics[row.metric_type] = {
        average: parseFloat(row.avg_value || 0),
        maximum: parseFloat(row.max_value || 0),
        minimum: parseFloat(row.min_value || 0)
      };
    });
    
    res.json({
      success: true,
      data: {
        period,
        metrics: {
          avg_response_time_minutes: metrics.avg_response_time?.average || 0,
          total_emergencies: Math.round(metrics.total_emergencies?.average || 0),
          ambulance_utilization_percentage: metrics.ambulance_utilization?.average || 0,
          hospital_bed_utilization_percentage: metrics.hospital_bed_utilization?.average || 0,
          daily_revenue: metrics.daily_revenue?.average || 0,
          collection_rate_percentage: metrics.collection_rate?.average || 0,
          critical_emergencies: Math.round(metrics.critical_emergencies?.average || 0),
          high_emergencies: Math.round(metrics.high_emergencies?.average || 0),
          medium_emergencies: Math.round(metrics.medium_emergencies?.average || 0),
          low_emergencies: Math.round(metrics.low_emergencies?.average || 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics'
    });
  }
});

// Get response time analytics
app.get('/api/analytics/response-time', async (req, res) => {
  try {
    const { period = '7d', group_by = 'day' } = req.query;
    
    let timeFilter = '';
    let groupByClause = '';
    
    switch (period) {
      case '24h':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '24 hours'";
        groupByClause = "DATE_TRUNC('hour', er.created_at)";
        break;
      case '7d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '7 days'";
        groupByClause = "DATE_TRUNC('day', er.created_at)";
        break;
      case '30d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '30 days'";
        groupByClause = "DATE_TRUNC('day', er.created_at)";
        break;
    }
    
    const query = `
      SELECT 
        ${groupByClause} as period,
        AVG(EXTRACT(EPOCH FROM (er.actual_arrival - er.created_at))/60) as avg_response_time,
        COUNT(*) as total_emergencies,
        COUNT(CASE WHEN er.priority_level = 1 THEN 1 END) as critical_count,
        COUNT(CASE WHEN er.priority_level = 2 THEN 1 END) as high_count,
        COUNT(CASE WHEN er.priority_level = 3 THEN 1 END) as medium_count,
        COUNT(CASE WHEN er.priority_level = 4 THEN 1 END) as low_count
      FROM emergency_requests er
      WHERE er.status = 'COMPLETED' 
        AND er.actual_arrival IS NOT NULL
        ${timeFilter}
      GROUP BY ${groupByClause}
      ORDER BY period
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        period: row.period,
        avg_response_time_minutes: parseFloat(row.avg_response_time || 0),
        total_emergencies: parseInt(row.total_emergencies || 0),
        priority_breakdown: {
          critical: parseInt(row.critical_count || 0),
          high: parseInt(row.high_count || 0),
          medium: parseInt(row.medium_count || 0),
          low: parseInt(row.low_count || 0)
        }
      }))
    });
    
  } catch (error) {
    console.error('Get response time analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch response time analytics'
    });
  }
});

// Get ambulance performance analytics
app.get('/api/analytics/ambulance-performance', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '7d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '30 days'";
        break;
      case '90d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '90 days'";
        break;
    }
    
    const query = `
      SELECT 
        a.id, a.license_plate, a.equipment_level,
        d.name as driver_name, d.rating as driver_rating,
        h.name as hospital_name,
        COUNT(er.id) as total_assignments,
        AVG(EXTRACT(EPOCH FROM (er.actual_arrival - er.created_at))/60) as avg_response_time,
        COUNT(CASE WHEN er.status = 'COMPLETED' THEN 1 END) as completed_assignments,
        COUNT(CASE WHEN er.priority_level = 1 THEN 1 END) as critical_assignments
      FROM ambulances a
      LEFT JOIN drivers d ON a.driver_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      LEFT JOIN emergency_requests er ON er.assigned_ambulance_id = a.id ${timeFilter}
      WHERE a.is_active = true
      GROUP BY a.id, a.license_plate, a.equipment_level, d.name, d.rating, h.name
      ORDER BY total_assignments DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(ambulance => ({
        ambulance_id: ambulance.id,
        license_plate: ambulance.license_plate,
        equipment_level: ambulance.equipment_level,
        driver: {
          name: ambulance.driver_name,
          rating: parseFloat(ambulance.driver_rating || 0)
        },
        hospital: {
          name: ambulance.hospital_name
        },
        performance: {
          total_assignments: parseInt(ambulance.total_assignments || 0),
          completed_assignments: parseInt(ambulance.completed_assignments || 0),
          completion_rate: ambulance.total_assignments > 0 ? 
            ((ambulance.completed_assignments / ambulance.total_assignments) * 100).toFixed(2) : 0,
          avg_response_time_minutes: parseFloat(ambulance.avg_response_time || 0),
          critical_assignments: parseInt(ambulance.critical_assignments || 0)
        }
      }))
    });
    
  } catch (error) {
    console.error('Get ambulance performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ambulance performance analytics'
    });
  }
});

// Get demand forecasting
app.get('/api/analytics/demand-forecast', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Get historical data for the last 30 days
    const historicalQuery = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as emergency_count,
        COUNT(CASE WHEN priority_level = 1 THEN 1 END) as critical_count,
        COUNT(CASE WHEN priority_level = 2 THEN 1 END) as high_count,
        COUNT(CASE WHEN priority_level = 3 THEN 1 END) as medium_count,
        COUNT(CASE WHEN priority_level = 4 THEN 1 END) as low_count
      FROM emergency_requests 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `;
    
    const historicalResult = await pool.query(historicalQuery);
    const historicalData = historicalResult.rows;
    
    // Simple forecasting using moving average
    const forecast = [];
    const avgDailyEmergencies = historicalData.length > 0 ? 
      historicalData.reduce((sum, day) => sum + day.emergency_count, 0) / historicalData.length : 0;
    
    const avgCritical = historicalData.length > 0 ? 
      historicalData.reduce((sum, day) => sum + day.critical_count, 0) / historicalData.length : 0;
    
    const avgHigh = historicalData.length > 0 ? 
      historicalData.reduce((sum, day) => sum + day.high_count, 0) / historicalData.length : 0;
    
    const avgMedium = historicalData.length > 0 ? 
      historicalData.reduce((sum, day) => sum + day.medium_count, 0) / historicalData.length : 0;
    
    const avgLow = historicalData.length > 0 ? 
      historicalData.reduce((sum, day) => sum + day.low_count, 0) / historicalData.length : 0;
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted_emergencies: Math.round(avgDailyEmergencies),
        priority_breakdown: {
          critical: Math.round(avgCritical),
          high: Math.round(avgHigh),
          medium: Math.round(avgMedium),
          low: Math.round(avgLow)
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        forecast_period_days: days,
        historical_data: historicalData.map(day => ({
          date: day.date,
          emergency_count: parseInt(day.emergency_count),
          priority_breakdown: {
            critical: parseInt(day.critical_count),
            high: parseInt(day.high_count),
            medium: parseInt(day.medium_count),
            low: parseInt(day.low_count)
          }
        })),
        forecast
      }
    });
    
  } catch (error) {
    console.error('Get demand forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate demand forecast'
    });
  }
});

// Get geographic analytics
app.get('/api/analytics/geographic', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let timeFilter = '';
    switch (period) {
      case '24h':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND er.created_at >= NOW() - INTERVAL '30 days'";
        break;
    }
    
    const query = `
      SELECT 
        ST_X(er.location) as longitude,
        ST_Y(er.location) as latitude,
        er.address,
        COUNT(*) as emergency_count,
        COUNT(CASE WHEN er.priority_level = 1 THEN 1 END) as critical_count,
        AVG(EXTRACT(EPOCH FROM (er.actual_arrival - er.created_at))/60) as avg_response_time
      FROM emergency_requests er
      WHERE er.status = 'COMPLETED' ${timeFilter}
      GROUP BY er.location, er.address
      ORDER BY emergency_count DESC
      LIMIT 50
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows.map(location => ({
        coordinates: {
          latitude: parseFloat(location.latitude),
          longitude: parseFloat(location.longitude)
        },
        address: location.address,
        emergency_count: parseInt(location.emergency_count),
        critical_count: parseInt(location.critical_count),
        avg_response_time_minutes: parseFloat(location.avg_response_time || 0)
      }))
    });
    
  } catch (error) {
    console.error('Get geographic analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geographic analytics'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Aapat Analytics Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log('Analytics service client connected:', socket.id);
  
  socket.on('join_analytics', (dashboardType) => {
    socket.join(`analytics_${dashboardType}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Analytics service client disconnected:', socket.id);
  });
});

// Background job to collect metrics every hour
cron.schedule('0 * * * *', async () => {
  console.log('Collecting analytics metrics...');
  
  try {
    await AnalyticsCollector.collectResponseTimeMetrics();
    await AnalyticsCollector.collectAmbulanceUtilizationMetrics();
    await AnalyticsCollector.collectHospitalCapacityMetrics();
    await AnalyticsCollector.collectFinancialMetrics();
    
    console.log('Analytics metrics collection completed');
  } catch (error) {
    console.error('Error in metrics collection job:', error);
  }
});

const PORT = process.env.PORT || 3008;
server.listen(PORT, () => {
  console.log(`🚑 Aapat Analytics Service running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
