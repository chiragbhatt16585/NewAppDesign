#!/usr/bin/env node

console.log('🔍 Testing API Response Structure\n');

// Simulate the actual API response structure based on HomeScreen usage
const mockApiResponse = {
  first_name: 'John',
  last_name: 'Doe',
  currentPlan: '100GB Plan',
  accountStatus: 'active',
  planPrice: '₹1200',
  planDuration: '30 days',
  expiryDateString: '2024-12-25',
  loginStatus: 'IN',
  usage_details: [
    {
      data_used: '75161927680', // ~70GB in bytes
      plan_data: '100 GB',
      days_used: '15',
      plan_days: '30',
      plan_hours: '720',
      hours_used: '360'
    }
  ]
};

console.log('📊 Mock API Response:');
console.log(JSON.stringify(mockApiResponse, null, 2));

console.log('\n🔍 Data Extraction Test:');
console.log('=======================');

// Extract data using the correct structure
const usageDetails = mockApiResponse.usage_details?.[0];
if (usageDetails) {
  const dataUsed = usageDetails.data_used || '0';
  const dataAllotted = usageDetails.plan_data || '100 GB';
  const daysUsed = parseInt(usageDetails.days_used || '0');
  const daysAllotted = parseInt(usageDetails.plan_days || '30');
  
  console.log('Raw data_used:', dataUsed);
  console.log('Raw plan_data:', dataAllotted);
  console.log('Raw days_used:', daysUsed);
  console.log('Raw plan_days:', daysAllotted);
  
  // Convert to GB
  const dataUsedGB = parseFloat(dataUsed) / (1024 * 1024 * 1024);
  // Handle plan_data format like "100 GB" or "Unlimited"
  const planDataGB = dataAllotted === 'Unlimited' ? 1000 : parseFloat(dataAllotted.split(' ')[0]);
  const daysRemaining = daysAllotted - daysUsed;
  const averageDailyUsage = daysUsed > 0 ? dataUsedGB / daysUsed : 0;
  const predictedUsage = averageDailyUsage * daysAllotted;
  const usagePercentage = (dataUsedGB / planDataGB) * 100;
  
  console.log('\n📈 Calculated Values:');
  console.log('=====================');
  console.log(`Data Used: ${dataUsedGB.toFixed(2)} GB`);
  console.log(`Plan Data: ${planDataGB.toFixed(2)} GB`);
  console.log(`Usage Percentage: ${usagePercentage.toFixed(1)}%`);
  console.log(`Days Used: ${daysUsed}`);
  console.log(`Days Remaining: ${daysRemaining}`);
  console.log(`Daily Average: ${averageDailyUsage.toFixed(2)} GB`);
  console.log(`Predicted Usage: ${predictedUsage.toFixed(2)} GB`);
  
  console.log('\n✅ AI Insights that would be generated:');
  console.log('=====================================');
  
  if (usagePercentage > 80) {
    console.log('⚠️  High Usage Alert: You\'ve used', usagePercentage.toFixed(0), '% of your data');
  }
  
  if (averageDailyUsage > 4) {
    console.log('📊 Usage Pattern: You typically use', averageDailyUsage.toFixed(2), 'GB daily');
  }
  
  if (usagePercentage < 50 && daysUsed > 10) {
    console.log('💰 Cost Savings: You\'re using only', usagePercentage.toFixed(0), '% of your plan');
  }
  
    if (daysRemaining <= 7) {
    console.log('⏰ Plan Expiry: Your plan expires in', daysRemaining, 'days');
  }
  
  console.log('\n🎯 Expected AI Component Display:');
  console.log('=================================');
  console.log(`Current Usage: ${dataUsedGB.toFixed(2)}GB / ${planDataGB.toFixed(2)}GB`);
  console.log(`AI Prediction: ${predictedUsage.toFixed(2)}GB by month end`);
  console.log(`Progress Bar: ${usagePercentage.toFixed(0)}% filled`);
  
} else {
  console.log('❌ No usage details found in API response');
}

console.log('\n✅ API Structure Test Complete!');
console.log('The AI components should now display real data instead of 0.00 GB'); 