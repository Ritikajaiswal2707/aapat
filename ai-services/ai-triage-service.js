// AI-Powered Emergency Triage and Priority Classification Service
const fs = require('fs');
const path = require('path');

class AITriageService {
  constructor() {
    this.isConfigured = true;
    this.triageHistory = [];
    this.patterns = this.loadPatterns();
    this.loadTriageHistory();
    console.log('🤖 AI Triage Service: Advanced emergency classification system active');
  }

  loadPatterns() {
    return {
      // Critical symptoms that indicate life-threatening conditions
      critical_symptoms: {
        'chest_pain': { weight: 0.9, keywords: ['chest pain', 'chest tightness', 'heart pain', 'angina'] },
        'difficulty_breathing': { weight: 0.95, keywords: ['can\'t breathe', 'shortness of breath', 'choking', 'gasping'] },
        'unconscious': { weight: 1.0, keywords: ['unconscious', 'passed out', 'not responding', 'collapsed'] },
        'severe_bleeding': { weight: 0.9, keywords: ['bleeding heavily', 'blood everywhere', 'arterial bleeding'] },
        'stroke_symptoms': { weight: 0.95, keywords: ['facial droop', 'slurred speech', 'weakness', 'numbness'] },
        'severe_allergic_reaction': { weight: 0.9, keywords: ['swelling', 'hives', 'difficulty swallowing', 'anaphylaxis'] }
      },
      
      // High priority symptoms
      high_priority_symptoms: {
        'severe_pain': { weight: 0.7, keywords: ['severe pain', 'excruciating', 'worst pain ever', 'can\'t move'] },
        'head_injury': { weight: 0.8, keywords: ['head injury', 'hit head', 'concussion', 'head trauma'] },
        'abdominal_pain': { weight: 0.6, keywords: ['severe stomach pain', 'abdominal pain', 'stomach ache'] },
        'fever_with_other_symptoms': { weight: 0.5, keywords: ['high fever', 'fever with', 'temperature'] },
        'mental_health_crisis': { weight: 0.8, keywords: ['suicidal', 'self harm', 'mental breakdown', 'crisis'] }
      },
      
      // Medium priority symptoms
      medium_priority_symptoms: {
        'moderate_pain': { weight: 0.4, keywords: ['moderate pain', 'uncomfortable', 'aching'] },
        'minor_injury': { weight: 0.3, keywords: ['cut', 'bruise', 'sprain', 'minor injury'] },
        'fever_only': { weight: 0.3, keywords: ['fever', 'temperature', 'hot'] },
        'nausea_vomiting': { weight: 0.4, keywords: ['nausea', 'vomiting', 'sick', 'throwing up'] }
      },
      
      // Low priority symptoms
      low_priority_symptoms: {
        'minor_ailments': { weight: 0.1, keywords: ['cold', 'cough', 'headache', 'tired'] },
        'routine_checkup': { weight: 0.05, keywords: ['checkup', 'routine', 'preventive'] }
      },
      
      // Patient risk factors
      risk_factors: {
        'age_risk': {
          'elderly': { weight: 0.3, age_range: [65, 120] },
          'infant': { weight: 0.4, age_range: [0, 2] },
          'child': { weight: 0.2, age_range: [2, 12] }
        },
        'medical_history': {
          'heart_disease': { weight: 0.4, conditions: ['heart disease', 'cardiac', 'hypertension', 'diabetes'] },
          'respiratory_issues': { weight: 0.3, conditions: ['asthma', 'copd', 'lung disease'] },
          'mental_health': { weight: 0.2, conditions: ['depression', 'anxiety', 'mental health'] }
        },
        'vital_signs': {
          'high_blood_pressure': { weight: 0.3, range: [140, 300] },
          'low_blood_pressure': { weight: 0.4, range: [0, 90] },
          'high_heart_rate': { weight: 0.2, range: [100, 300] },
          'low_heart_rate': { weight: 0.3, range: [0, 60] }
        }
      },
      
      // Environmental factors
      environmental_factors: {
        'time_of_day': {
          'night': { weight: 0.1, hours: [22, 6] },
          'rush_hour': { weight: 0.05, hours: [7, 9, 17, 19] }
        },
        'weather': {
          'extreme_heat': { weight: 0.2, condition: 'heat' },
          'extreme_cold': { weight: 0.2, condition: 'cold' },
          'storm': { weight: 0.1, condition: 'storm' }
        },
        'location': {
          'highway': { weight: 0.3, keywords: ['highway', 'freeway', 'motorway'] },
          'remote_area': { weight: 0.4, keywords: ['remote', 'rural', 'isolated'] },
          'crowded_area': { weight: 0.1, keywords: ['crowded', 'busy', 'downtown'] }
        }
      }
    };
  }

  loadTriageHistory() {
    try {
      const dataPath = path.join(__dirname, '..', 'mock-data', 'triageHistory.json');
      if (fs.existsSync(dataPath)) {
        this.triageHistory = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (error) {
      console.log('🤖 No triage history found, starting fresh');
      this.triageHistory = [];
    }
  }

  saveTriageHistory() {
    try {
      const dataDir = path.join(__dirname, '..', 'mock-data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataPath = path.join(dataDir, 'triageHistory.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.triageHistory, null, 2));
    } catch (error) {
      console.error('🤖 Error saving triage history:', error.message);
    }
  }

  // Main triage classification function
  async classifyEmergency(emergencyData) {
    console.log('🤖 AI Triage: Analyzing emergency data...');
    
    const analysis = {
      emergency_id: emergencyData.emergency_id || 'triage_' + Date.now(),
      timestamp: new Date(),
      input_data: emergencyData,
      analysis_steps: [],
      final_classification: null,
      confidence_score: 0,
      recommendations: [],
      risk_assessment: {}
    };

    // Step 1: Symptom Analysis
    const symptomAnalysis = this.analyzeSymptoms(emergencyData);
    analysis.analysis_steps.push({
      step: 'symptom_analysis',
      result: symptomAnalysis,
      confidence: symptomAnalysis.confidence
    });

    // Step 2: Patient Risk Assessment
    const riskAssessment = this.assessPatientRisk(emergencyData);
    analysis.analysis_steps.push({
      step: 'risk_assessment',
      result: riskAssessment,
      confidence: riskAssessment.confidence
    });

    // Step 3: Environmental Analysis
    const environmentalAnalysis = this.analyzeEnvironment(emergencyData);
    analysis.analysis_steps.push({
      step: 'environmental_analysis',
      result: environmentalAnalysis,
      confidence: environmentalAnalysis.confidence
    });

    // Step 4: Historical Pattern Analysis
    const patternAnalysis = this.analyzePatterns(emergencyData);
    analysis.analysis_steps.push({
      step: 'pattern_analysis',
      result: patternAnalysis,
      confidence: patternAnalysis.confidence
    });

    // Step 5: Final Classification
    const finalClassification = this.generateFinalClassification(analysis);
    analysis.final_classification = finalClassification;
    analysis.confidence_score = finalClassification.confidence;
    analysis.recommendations = finalClassification.recommendations;
    analysis.risk_assessment = finalClassification.risk_assessment;

    // Store triage result
    this.triageHistory.push(analysis);
    this.saveTriageHistory();

    return {
      success: true,
      message: 'AI triage analysis completed successfully',
      data: {
        emergency_id: analysis.emergency_id,
        priority_level: finalClassification.priority_level,
        priority_name: finalClassification.priority_name,
        confidence_score: finalClassification.confidence,
        estimated_response_time: finalClassification.estimated_response_time,
        recommended_ambulance_type: finalClassification.recommended_ambulance_type,
        risk_factors: finalClassification.risk_factors,
        recommendations: finalClassification.recommendations,
        analysis_details: analysis
      }
    };
  }

  // Analyze symptoms and their severity
  analyzeSymptoms(emergencyData) {
    const symptoms = emergencyData.symptoms || emergencyData.description || '';
    const emergencyType = emergencyData.emergency_type || '';
    const combinedText = `${symptoms} ${emergencyType}`.toLowerCase();

    let totalScore = 0;
    let matchedSymptoms = [];
    let confidence = 0;

    // Check critical symptoms
    Object.entries(this.patterns.critical_symptoms).forEach(([symptom, data]) => {
      const matches = data.keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        totalScore += data.weight;
        matchedSymptoms.push({
          symptom: symptom,
          matches: matches,
          weight: data.weight,
          category: 'critical'
        });
        confidence += 0.3;
      }
    });

    // Check high priority symptoms
    Object.entries(this.patterns.high_priority_symptoms).forEach(([symptom, data]) => {
      const matches = data.keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        totalScore += data.weight;
        matchedSymptoms.push({
          symptom: symptom,
          matches: matches,
          weight: data.weight,
          category: 'high'
        });
        confidence += 0.2;
      }
    });

    // Check medium priority symptoms
    Object.entries(this.patterns.medium_priority_symptoms).forEach(([symptom, data]) => {
      const matches = data.keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        totalScore += data.weight;
        matchedSymptoms.push({
          symptom: symptom,
          matches: matches,
          weight: data.weight,
          category: 'medium'
        });
        confidence += 0.1;
      }
    });

    // Check low priority symptoms
    Object.entries(this.patterns.low_priority_symptoms).forEach(([symptom, data]) => {
      const matches = data.keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      );
      if (matches.length > 0) {
        totalScore += data.weight;
        matchedSymptoms.push({
          symptom: symptom,
          matches: matches,
          weight: data.weight,
          category: 'low'
        });
        confidence += 0.05;
      }
    });

    return {
      total_score: totalScore,
      matched_symptoms: matchedSymptoms,
      confidence: Math.min(confidence, 1.0),
      symptom_count: matchedSymptoms.length
    };
  }

  // Assess patient risk factors
  assessPatientRisk(emergencyData) {
    const patientInfo = emergencyData.patient_info || {};
    const age = patientInfo.age || 30;
    const medicalHistory = patientInfo.medical_history || [];
    const vitalSigns = emergencyData.vital_signs || {};

    let riskScore = 0;
    let riskFactors = [];
    let confidence = 0.5;

    // Age-based risk
    Object.entries(this.patterns.risk_factors.age_risk).forEach(([ageGroup, data]) => {
      if (age >= data.age_range[0] && age <= data.age_range[1]) {
        riskScore += data.weight;
        riskFactors.push({
          factor: `age_${ageGroup}`,
          value: age,
          weight: data.weight,
          description: `Patient is ${ageGroup} (${age} years old)`
        });
        confidence += 0.1;
      }
    });

    // Medical history risk
    Object.entries(this.patterns.risk_factors.medical_history).forEach(([condition, data]) => {
      const hasCondition = medicalHistory.some(history => 
        data.conditions.some(cond => 
          history.toLowerCase().includes(cond.toLowerCase())
        )
      );
      if (hasCondition) {
        riskScore += data.weight;
        riskFactors.push({
          factor: `medical_${condition}`,
          value: medicalHistory,
          weight: data.weight,
          description: `Patient has ${condition} in medical history`
        });
        confidence += 0.1;
      }
    });

    // Vital signs risk
    Object.entries(this.patterns.risk_factors.vital_signs).forEach(([vital, data]) => {
      const value = vitalSigns[vital];
      if (value && value >= data.range[0] && value <= data.range[1]) {
        riskScore += data.weight;
        riskFactors.push({
          factor: `vital_${vital}`,
          value: value,
          weight: data.weight,
          description: `${vital} is ${value} (outside normal range)`
        });
        confidence += 0.1;
      }
    });

    return {
      risk_score: riskScore,
      risk_factors: riskFactors,
      confidence: Math.min(confidence, 1.0),
      risk_level: this.calculateRiskLevel(riskScore)
    };
  }

  // Analyze environmental factors
  analyzeEnvironment(emergencyData) {
    const address = emergencyData.address || '';
    const time = new Date();
    const hour = time.getHours();
    const weather = emergencyData.weather || 'normal';

    let envScore = 0;
    let envFactors = [];
    let confidence = 0.3;

    // Time of day analysis
    Object.entries(this.patterns.environmental_factors.time_of_day).forEach(([timePeriod, data]) => {
      if (timePeriod === 'night' && (hour >= data.hours[0] || hour <= data.hours[1])) {
        envScore += data.weight;
        envFactors.push({
          factor: 'time_night',
          value: hour,
          weight: data.weight,
          description: 'Emergency occurred during night hours'
        });
        confidence += 0.1;
      } else if (timePeriod === 'rush_hour' && 
                 ((hour >= data.hours[0] && hour <= data.hours[1]) || 
                  (hour >= data.hours[2] && hour <= data.hours[3]))) {
        envScore += data.weight;
        envFactors.push({
          factor: 'time_rush_hour',
          value: hour,
          weight: data.weight,
          description: 'Emergency occurred during rush hour'
        });
        confidence += 0.1;
      }
    });

    // Weather analysis
    Object.entries(this.patterns.environmental_factors.weather).forEach(([weatherType, data]) => {
      if (weather.toLowerCase().includes(data.condition)) {
        envScore += data.weight;
        envFactors.push({
          factor: `weather_${weatherType}`,
          value: weather,
          weight: data.weight,
          description: `Emergency occurred during ${weatherType} weather`
        });
        confidence += 0.1;
      }
    });

    // Location analysis
    Object.entries(this.patterns.environmental_factors.location).forEach(([locationType, data]) => {
      const hasLocation = data.keywords.some(keyword => 
        address.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasLocation) {
        envScore += data.weight;
        envFactors.push({
          factor: `location_${locationType}`,
          value: address,
          weight: data.weight,
          description: `Emergency occurred in ${locationType} area`
        });
        confidence += 0.1;
      }
    });

    return {
      environment_score: envScore,
      environment_factors: envFactors,
      confidence: Math.min(confidence, 1.0),
      weather: weather,
      time_of_day: hour
    };
  }

  // Analyze historical patterns
  analyzePatterns(emergencyData) {
    const emergencyType = emergencyData.emergency_type || '';
    const location = emergencyData.address || '';
    const time = new Date();
    const hour = time.getHours();
    const dayOfWeek = time.getDay();

    let patternScore = 0;
    let patterns = [];
    let confidence = 0.2;

    // Analyze similar emergencies in history
    const similarEmergencies = this.triageHistory.filter(record => 
      record.input_data.emergency_type === emergencyType
    );

    if (similarEmergencies.length > 0) {
      const avgPriority = similarEmergencies.reduce((sum, record) => 
        sum + (record.final_classification?.priority_level || 3), 0
      ) / similarEmergencies.length;

      patternScore += avgPriority * 0.3;
      patterns.push({
        pattern: 'historical_priority',
        value: avgPriority,
        weight: 0.3,
        description: `Average priority for ${emergencyType} emergencies: ${avgPriority.toFixed(1)}`
      });
      confidence += 0.2;
    }

    // Analyze time-based patterns
    const timeBasedEmergencies = this.triageHistory.filter(record => {
      const recordTime = new Date(record.timestamp);
      return recordTime.getHours() === hour;
    });

    if (timeBasedEmergencies.length > 0) {
      const avgPriority = timeBasedEmergencies.reduce((sum, record) => 
        sum + (record.final_classification?.priority_level || 3), 0
      ) / timeBasedEmergencies.length;

      patternScore += avgPriority * 0.2;
      patterns.push({
        pattern: 'time_based_priority',
        value: avgPriority,
        weight: 0.2,
        description: `Average priority for emergencies at ${hour}:00: ${avgPriority.toFixed(1)}`
      });
      confidence += 0.1;
    }

    return {
      pattern_score: patternScore,
      patterns: patterns,
      confidence: Math.min(confidence, 1.0),
      historical_data_points: similarEmergencies.length
    };
  }

  // Generate final classification
  generateFinalClassification(analysis) {
    const symptomScore = analysis.analysis_steps.find(s => s.step === 'symptom_analysis')?.result?.total_score || 0;
    const riskScore = analysis.analysis_steps.find(s => s.step === 'risk_assessment')?.result?.risk_score || 0;
    const envScore = analysis.analysis_steps.find(s => s.step === 'environmental_analysis')?.result?.environment_score || 0;
    const patternScore = analysis.analysis_steps.find(s => s.step === 'pattern_analysis')?.result?.pattern_score || 0;

    // Calculate weighted total score
    const totalScore = (symptomScore * 0.5) + (riskScore * 0.3) + (envScore * 0.1) + (patternScore * 0.1);
    
    // Determine priority level
    let priorityLevel, priorityName, estimatedResponseTime, recommendedAmbulanceType;
    
    if (totalScore >= 0.8) {
      priorityLevel = 1;
      priorityName = 'CRITICAL';
      estimatedResponseTime = '2-5 minutes';
      recommendedAmbulanceType = 'CRITICAL_CARE';
    } else if (totalScore >= 0.6) {
      priorityLevel = 2;
      priorityName = 'HIGH';
      estimatedResponseTime = '5-10 minutes';
      recommendedAmbulanceType = 'ADVANCED';
    } else if (totalScore >= 0.4) {
      priorityLevel = 3;
      priorityName = 'MEDIUM';
      estimatedResponseTime = '10-15 minutes';
      recommendedAmbulanceType = 'INTERMEDIATE';
    } else {
      priorityLevel = 4;
      priorityName = 'LOW';
      estimatedResponseTime = '15-30 minutes';
      recommendedAmbulanceType = 'BASIC';
    }

    // Calculate confidence
    const confidence = Math.min(
      (analysis.analysis_steps.reduce((sum, step) => sum + step.confidence, 0) / analysis.analysis_steps.length),
      1.0
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, priorityLevel);

    return {
      priority_level: priorityLevel,
      priority_name: priorityName,
      confidence: confidence,
      estimated_response_time: estimatedResponseTime,
      recommended_ambulance_type: recommendedAmbulanceType,
      risk_factors: analysis.analysis_steps.find(s => s.step === 'risk_assessment')?.result?.risk_factors || [],
      recommendations: recommendations,
      total_score: totalScore,
      score_breakdown: {
        symptom_score: symptomScore,
        risk_score: riskScore,
        environment_score: envScore,
        pattern_score: patternScore
      }
    };
  }

  // Generate recommendations based on analysis
  generateRecommendations(analysis, priorityLevel) {
    const recommendations = [];

    // Priority-based recommendations
    if (priorityLevel === 1) {
      recommendations.push('Immediate dispatch of critical care ambulance');
      recommendations.push('Alert nearest hospital emergency department');
      recommendations.push('Prepare for potential life-saving interventions');
    } else if (priorityLevel === 2) {
      recommendations.push('Dispatch advanced ambulance within 10 minutes');
      recommendations.push('Notify hospital of incoming patient');
      recommendations.push('Monitor patient condition closely');
    } else if (priorityLevel === 3) {
      recommendations.push('Schedule ambulance dispatch within 15 minutes');
      recommendations.push('Assess if patient can wait for transport');
    } else {
      recommendations.push('Schedule non-emergency transport');
      recommendations.push('Consider alternative transport methods');
    }

    // Risk factor-based recommendations
    const riskFactors = analysis.analysis_steps.find(s => s.step === 'risk_assessment')?.result?.risk_factors || [];
    riskFactors.forEach(risk => {
      if (risk.factor.includes('age_elderly')) {
        recommendations.push('Extra care due to elderly patient');
      }
      if (risk.factor.includes('age_infant')) {
        recommendations.push('Pediatric specialist may be needed');
      }
      if (risk.factor.includes('medical_heart_disease')) {
        recommendations.push('Cardiac monitoring recommended');
      }
    });

    // Environmental recommendations
    const envFactors = analysis.analysis_steps.find(s => s.step === 'environmental_analysis')?.result?.environment_factors || [];
    envFactors.forEach(env => {
      if (env.factor.includes('location_remote')) {
        recommendations.push('Consider helicopter transport for remote location');
      }
      if (env.factor.includes('weather_extreme')) {
        recommendations.push('Weather conditions may affect response time');
      }
    });

    return recommendations;
  }

  // Calculate risk level
  calculateRiskLevel(riskScore) {
    if (riskScore >= 0.7) return 'HIGH';
    if (riskScore >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  // Get triage statistics
  getTriageStatistics() {
    const stats = {
      total_triages: this.triageHistory.length,
      by_priority: { 1: 0, 2: 0, 3: 0, 4: 0 },
      average_confidence: 0,
      common_symptoms: {},
      risk_factors: {},
      recent_24h: 0
    };

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    let totalConfidence = 0;

    this.triageHistory.forEach(record => {
      // Count by priority
      const priority = record.final_classification?.priority_level || 3;
      stats.by_priority[priority]++;

      // Calculate average confidence
      totalConfidence += record.final_classification?.confidence || 0;

      // Count recent triages
      if (new Date(record.timestamp) >= yesterday) {
        stats.recent_24h++;
      }

      // Count common symptoms
      const symptoms = record.analysis_steps.find(s => s.step === 'symptom_analysis')?.result?.matched_symptoms || [];
      symptoms.forEach(symptom => {
        stats.common_symptoms[symptom.symptom] = (stats.common_symptoms[symptom.symptom] || 0) + 1;
      });

      // Count risk factors
      const riskFactors = record.analysis_steps.find(s => s.step === 'risk_assessment')?.result?.risk_factors || [];
      riskFactors.forEach(risk => {
        stats.risk_factors[risk.factor] = (stats.risk_factors[risk.factor] || 0) + 1;
      });
    });

    stats.average_confidence = this.triageHistory.length > 0 ? 
      (totalConfidence / this.triageHistory.length).toFixed(2) : 0;

    return {
      success: true,
      data: stats
    };
  }

  // Test AI triage functionality
  async testTriage() {
    console.log('🧪 Testing AI Triage Service...');
    
    const testEmergency = {
      emergency_id: 'test_triage_001',
      emergency_type: 'Heart Attack',
      symptoms: 'severe chest pain, difficulty breathing, sweating',
      patient_info: {
        name: 'Test Patient',
        age: 65,
        medical_history: ['hypertension', 'diabetes'],
        blood_group: 'A+'
      },
      address: '123 Main Street, New Delhi',
      vital_signs: {
        blood_pressure: 180,
        heart_rate: 110
      },
      weather: 'normal'
    };

    const result = await this.classifyEmergency(testEmergency);
    console.log('✅ AI Triage Test successful');
    return {
      success: true,
      message: 'AI Triage service test successful',
      data: result
    };
  }
}

module.exports = AITriageService;
