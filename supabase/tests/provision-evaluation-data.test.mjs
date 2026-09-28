import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluationVehicles, provisionEvaluationData } from '../scripts/provision_evaluation_data.mjs';

test('evaluation inventory is realistic, varied and deterministic', () => {
  assert.equal(evaluationVehicles.length, 5);
  assert.equal(new Set(evaluationVehicles.map((x) => x.requestId)).size, 5);
  assert.equal(evaluationVehicles.filter((x) => x.type === 'FOR_SALE').length, 3);
  assert.equal(evaluationVehicles.filter((x) => x.type === 'FOR_HIRE').length, 2);
  assert.ok(evaluationVehicles.every((x) => x.price > 100000 && x.description.length > 60));
  assert.ok(evaluationVehicles.every((x) => ['CAR', 'TRUCK'].includes(x.vehicle.type)));
});

test('evaluation data provisioning fails closed before network access', async () => {
  await assert.rejects(() => provisionEvaluationData({ env: {}, fetchImpl: async () => assert.fail() }), /Refusing/);
});
