import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('--- Starting Backend & Python Microservice Integration Tests ---');
  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    if (res.status === 200 && res.data.status === 'healthy') {
      console.log('✓ Test 1 Passed: GET /api/health');
      passed++;
    } else {
      throw new Error('Invalid health response');
    }
  } catch (err) {
    console.error('✗ Test 1 Failed: GET /api/health -', err.message);
    failed++;
  }

  // Test 2: Simulation status
  try {
    const res = await axios.get(`${BASE_URL}/simulation/status`);
    if (res.status === 200 && res.data.state) {
      console.log('✓ Test 2 Passed: GET /api/simulation/status');
      passed++;
    } else {
      throw new Error('Invalid simulation status response');
    }
  } catch (err) {
    console.error('✗ Test 2 Failed: GET /api/simulation/status -', err.message);
    failed++;
  }

  // Test 3: Simulation step tick
  try {
    const res = await axios.post(`${BASE_URL}/simulation/step`);
    if (res.status === 200 && res.data.drones && res.data.drones.length > 0) {
      console.log('✓ Test 3 Passed: POST /api/simulation/step (Drones returned:', res.data.drones.length, ')');
      passed++;
    } else {
      throw new Error('Invalid step response');
    }
  } catch (err) {
    console.error('✗ Test 3 Failed: POST /api/simulation/step -', err.message);
    failed++;
  }

  // Test 4: Fault injection
  try {
    const res = await axios.post(`${BASE_URL}/faults/inject`, {
      droneId: 'UAV-Alpha',
      component: 'rgb_camera',
      faultType: 'hardware_failure',
      severity: 1.0,
      gradual: false
    });
    if (res.status === 200 && res.data.success) {
      console.log('✓ Test 4 Passed: POST /api/faults/inject');
      passed++;
    } else {
      throw new Error('Invalid fault injection response');
    }
  } catch (err) {
    console.error('✗ Test 4 Failed: POST /api/faults/inject -', err.message);
    failed++;
  }

  // Test 5: Coordination topology
  try {
    const res = await axios.get(`${BASE_URL}/coordination/topology`);
    if (res.status === 200 && res.data.topology) {
      console.log('✓ Test 5 Passed: GET /api/coordination/topology');
      passed++;
    } else {
      throw new Error('Invalid coordination response');
    }
  } catch (err) {
    console.error('✗ Test 5 Failed: GET /api/coordination/topology -', err.message);
    failed++;
  }

  // Test 6: Analytics benchmark run
  try {
    const res = await axios.post(`${BASE_URL}/analytics/run`, {
      numDrones: 4,
      numVictims: 5,
      faultProbability: 0.3,
      simulationDurationSec: 10,
      randomSeed: 42
    });
    if (res.status === 200 && res.data.results && res.data.results.D_PROPOSED_CONFIDENCE_AWARE) {
      console.log('✓ Test 6 Passed: POST /api/analytics/run (Proposed F1:', res.data.results.D_PROPOSED_CONFIDENCE_AWARE.f1Score, ')');
      passed++;
    } else {
      throw new Error('Invalid benchmark response');
    }
  } catch (err) {
    console.error('✗ Test 6 Failed: POST /api/analytics/run -', err.message);
    failed++;
  }

  console.log(`\nIntegration Test Summary: ${passed} Passed, ${failed} Failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
