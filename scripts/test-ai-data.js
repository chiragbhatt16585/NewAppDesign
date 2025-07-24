#!/usr/bin/env node

// Test script to simulate AI data processing
console.log('🤖 Testing AI Data Processing...\n');

// Simulate different usage scenarios
const testScenarios = [
  {
    name: 'High Usage - Limited Plan',
    data: {
      data_used: '6442450944', // 6GB in bytes
      plan_data: '10 GB',
      days_used: '15',
      plan_days: '30',
      current_plan: 'Basic Plan'
    }
  },
  {
    name: 'Low Usage - Limited Plan',
    data: {
      data_used: '1073741824', // 1GB in bytes
      plan_data: '100 GB',
      days_used: '20',
      plan_days: '30',
      current_plan: 'Premium Plan'
    }
  },
  {
    name: 'Unlimited Plan - High Daily Usage',
    data: {
      data_used: '21474836480', // 20GB in bytes
      plan_data: 'Unlimited',
      days_used: '10',
      plan_days: '30',
      current_plan: 'Unlimited Plan'
    }
  },
  {
    name: 'Unlimited Plan - Low Daily Usage',
    data: {
      data_used: '5368709120', // 5GB in bytes
      plan_data: 'Unlimited',
      days_used: '25',
      plan_days: '30',
      current_plan: 'Unlimited Plan'
    }
  }
];

function processUsageData(usageDetails) {
  const dataUsed = usageDetails.data_used || '0';
  const dataAllotted = usageDetails.plan_data || '100 GB';
  const daysUsed = parseInt(usageDetails.days_used || '0');
  const planDays = parseInt(usageDetails.plan_days || '30');
  
  // Convert bytes to GB
  const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
  
  // Handle unlimited plans
  const isUnlimited = dataAllotted === 'Unlimited';
  const planDataGB = isUnlimited ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
  
  const daysRemaining = Math.max(0, planDays - daysUsed);
  const averageDailyUsage = daysUsed > 0 ? dataUsedGB / daysUsed : 0;
  const predictedUsage = averageDailyUsage * planDays;
  const usagePercentage = (dataUsedGB / planDataGB) * 100;

  return {
    currentUsage: dataUsedGB,
    totalData: planDataGB,
    daysUsed,
    daysRemaining,
    averageDailyUsage,
    predictedUsage,
    isUnlimited,
    usagePercentage
  };
}

function generateAIInsights(usageData) {
  const insights = [];

  // High usage warning (60% threshold)
  if (!usageData.isUnlimited && usageData.usagePercentage > 60) {
    insights.push({
      type: 'warning',
      title: 'High Data Usage Alert',
      message: `You've used ${usageData.usagePercentage.toFixed(0)}% of your data. Consider upgrading to avoid overage charges.`,
      action: 'Upgrade Plan'
    });
  }

  // Speed upgrade recommendation for unlimited plans (3GB threshold)
  if (usageData.isUnlimited && usageData.averageDailyUsage > 3) {
    insights.push({
      type: 'recommendation',
      title: 'Speed Upgrade Recommended',
      message: `You're using ${usageData.averageDailyUsage.toFixed(1)}GB daily. Upgrade to higher speeds for better performance.`,
      action: 'View Speed Plans'
    });
  }

  // Plan optimization (40% threshold)
  if (!usageData.isUnlimited && usageData.usagePercentage < 40 && usageData.daysUsed > 10) {
    insights.push({
      type: 'savings',
      title: 'Plan Optimization',
      message: `You're using only ${usageData.usagePercentage.toFixed(0)}% of your data. Consider a smaller plan to save money.`,
      action: 'View Plans'
    });
  }

  // Usage pattern insight (4GB threshold)
  if (usageData.averageDailyUsage > 4) {
    insights.push({
      type: 'info',
      title: 'Usage Pattern Analysis',
      message: `You're averaging ${usageData.averageDailyUsage.toFixed(1)}GB daily. ${usageData.isUnlimited ? 'Great! You have unlimited data.' : 'This suggests you need a larger plan.'}`,
      action: usageData.isUnlimited ? 'View Speed Plans' : 'Upgrade Plan'
    });
  }

  // Early renewal reminder
  if (usageData.daysRemaining <= 5) {
    insights.push({
      type: 'warning',
      title: 'Plan Expiring Soon',
      message: `Your plan expires in ${usageData.daysRemaining} days. Renew early to avoid service interruption.`,
      action: 'Renew Now'
    });
  }

  // Fallback insight
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'AI Usage Analysis',
      message: `You're using ${usageData.averageDailyUsage.toFixed(1)}GB daily. ${usageData.isUnlimited ? 'Great! You have unlimited data.' : 'Monitor your usage to optimize your plan.'}`,
      action: 'View Plans'
    });
  }

  return insights;
}

// Test each scenario
testScenarios.forEach((scenario, index) => {
  console.log(`📊 Scenario ${index + 1}: ${scenario.name}`);
  console.log('Input Data:', scenario.data);
  
  const usageData = processUsageData(scenario.data);
  console.log('Processed Usage Data:', {
    currentUsage: `${usageData.currentUsage.toFixed(2)}GB`,
    totalData: `${usageData.totalData}GB`,
    usagePercentage: `${usageData.usagePercentage.toFixed(1)}%`,
    averageDailyUsage: `${usageData.averageDailyUsage.toFixed(2)}GB/day`,
    daysRemaining: usageData.daysRemaining,
    isUnlimited: usageData.isUnlimited
  });
  
  const insights = generateAIInsights(usageData);
  console.log(`Generated ${insights.length} insights:`);
  insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. ${insight.icon} ${insight.title}`);
    console.log(`     ${insight.message}`);
    console.log(`     Action: ${insight.action}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
});

console.log('✅ AI Data Processing Test Complete!'); 