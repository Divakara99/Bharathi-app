import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const pin = process.env.TEST_DELETE_PIN ?? "9676";
const prefix = `QA expenses ${randomUUID().slice(0, 8)}`;
const owned = { employees: [], reports: [], expenses: [] };
const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
const json = (body, method = "POST") => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
async function request(path, options) {
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(25000) });
  return { status: response.status, data: await response.json() };
}
async function must(path, body, expectedStatus = 201) {
  const result = await request(path, json(body));
  assert.equal(result.status, expectedStatus, JSON.stringify(result.data));
  return result.data;
}
async function remove(kind, id, attemptPin = pin, expectedStatus = 200) {
  const result = await request("/api/delete", json({ kind, id, pin: attemptPin }));
  assert.equal(result.status, expectedStatus, JSON.stringify(result.data));
  return result.data;
}
async function snapshot() {
  const results = await Promise.all([request("/api/employees"), request("/api/reports"), request("/api/expenses")]);
  results.forEach((r) => assert.equal(r.status, 200));
  return { employees: sort(results[0].data.employees), reports: sort(results[1].data.reports), expenses: sort(results[2].data.expenses) };
}
async function addEmployee(suffix) {
  const { employee } = await must("/api/employees", { name: `${prefix} ${suffix}` });
  owned.employees.push(employee.id);
  return employee;
}
async function addExpense(employeeId, amount, year = 2099, month = 1) {
  const { expense } = await must("/api/expenses", { employeeId, year, month, amount, notes: prefix });
  if (!owned.expenses.includes(expense.id)) owned.expenses.push(expense.id);
  return expense;
}
async function addReport(employee, deliveries, price, cycle) {
  const { report } = await must("/api/reports", { empName: employee.name, year: 2099, month: 1, cycle, deliveries, pricePerDelivery: price, notes: prefix });
  owned.reports.push(report.id);
  return report;
}

let baseline;
try {
  if (existsSync("/tmp/employee-expenses-legacy.json")) {
    const fixture = JSON.parse(readFileSync("/tmp/employee-expenses-legacy.json", "utf8"));
    const state = await snapshot();
    const migrated = state.expenses.find((e) => e.id === fixture.id);
    if (migrated) {
      assert.equal(migrated.notes, fixture.notes);
      assert.equal(migrated.amount, fixture.amount);
      assert.equal(migrated.employeeId, null);
      assert.equal(migrated.employeeName, null);
      await remove("expense", migrated.id);
      console.log("PASS: pre-upgrade expense row survives unchanged as General business expenses.");
    }
  }
  baseline = await snapshot();
  if (existsSync("/tmp/employee-expenses-baseline.json")) {
    const before = JSON.parse(readFileSync("/tmp/employee-expenses-baseline.json", "utf8"));
    assert.deepEqual(baseline.employees, sort(before.employees));
    assert.deepEqual(baseline.reports, sort(before.reports));
    const project = (e) => ({ id: e.id, year: e.year, month: e.month, amount: e.amount, notes: e.notes, updatedAt: e.updatedAt });
    assert.deepEqual(baseline.expenses.map(project), sort(before.expenses).map(project));
    before.expenses.forEach((old) => assert.equal(baseline.expenses.find((e) => e.id === old.id)?.employeeId, null));
    console.log("PASS: original saved reports, employees and expense amounts preserved through the upgrade.");
  }
  const alpha = await addEmployee("Alpha");
  const beta = await addEmployee("Beta");
  const expenseOnly = await addEmployee("Expense only");
  await addReport(alpha, 100, 20, 1);
  await addReport(alpha, 150, 20, 2);
  await addReport(beta, 200, 25, 1);
  const a = await addExpense(alpha.id, 600);
  const b = await addExpense(beta.id, 800);
  assert.notEqual(a.id, b.id);
  const updated = await addExpense(alpha.id, 650);
  assert.equal(updated.id, a.id);
  const aNextMonth = await addExpense(alpha.id, 125, 2099, 2);
  const aOtherYear = await addExpense(alpha.id, 50, 2098, 1);
  assert.notEqual(aNextMonth.id, a.id);
  assert.notEqual(aOtherYear.id, a.id);
  const selected = await request(`/api/expenses?year=2099&employeeId=${alpha.id}`);
  assert.equal(selected.data.expenses.length, 2);
  assert.ok(selected.data.expenses.every((e) => e.employeeId === alpha.id && e.employeeName === alpha.name));
  assert.equal(selected.data.expenses.find((e) => e.id === a.id).amount, "650.00");
  const betaRows = await request(`/api/expenses?year=2099&employeeId=${beta.id}`);
  assert.equal(betaRows.data.expenses.find((e) => e.id === b.id).amount, "800.00");
  const reportRows = (await request("/api/reports?year=2099")).data.reports;
  const alphaIncome = reportRows.filter((r) => r.empName === alpha.name).reduce((sum, r) => sum + Number(r.totalValue), 0);
  const alphaCost = selected.data.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  assert.equal(alphaIncome, 5000);
  assert.equal(alphaCost, 775);
  assert.equal(alphaIncome - alphaCost, 4225);
  console.log("PASS: same-month employee entries coexist; updates do not overwrite another employee; year/month filters and both-cycle totals are correct.");

  for (const body of [
    { year: 2099, month: 1, amount: 1 },
    { employeeId: alpha.id, year: 2099, month: 13, amount: 1 },
    { employeeId: alpha.id, year: 2099, month: 1, amount: -1 },
    { employeeId: alpha.id, year: 2099, month: 1, amount: "not a number" },
    { employeeId: alpha.id, year: 2099, month: 1, amount: "" },
  ]) assert.equal((await request("/api/expenses", json(body))).status, 400);
  assert.equal((await request("/api/expenses", json({ employeeId: 2147483647, year: 2099, month: 1, amount: 1 }))).status, 404);
  console.log("PASS: missing/unknown employee, invalid period and negative or invalid amount are rejected.");

  const zero = await addExpense(expenseOnly.id, 0);
  await remove("employee", expenseOnly.id, pin, 409);
  const wrong = await remove("expense", a.id, "1234", 403);
  assert.equal(wrong.code, "WRONG_PIN");
  assert.equal((await request(`/api/expenses?employeeId=${alpha.id}`)).data.expenses.some((e) => e.id === a.id), true);
  await remove("expense", a.id);
  assert.equal((await request(`/api/expenses?employeeId=${beta.id}`)).data.expenses.some((e) => e.id === b.id), true);
  assert.equal((await request(`/api/expenses?employeeId=${alpha.id}`)).data.expenses.some((e) => e.id === aNextMonth.id), true);
  console.log("PASS: wrong PIN retains data; correct PIN deletes only one expense; employee deletion is blocked even for a zero-value expense.");
  await remove("expense", zero.id);
  await remove("employee", expenseOnly.id);

  const usedGeneral = baseline.expenses.filter((e) => e.employeeId === null && e.year === 2100).map((e) => e.month);
  const freeMonth = Array.from({ length: 12 }, (_, i) => i + 1).find((m) => !usedGeneral.includes(m));
  if (freeMonth) {
    const general = await addExpense(null, 100, 2100, freeMonth);
    const generalUpdate = await addExpense(null, 110, 2100, freeMonth);
    assert.equal(generalUpdate.id, general.id);
    const individual = await addExpense(beta.id, 10, 2100, freeMonth);
    const generalFiltered = (await request("/api/expenses?year=2100&employeeId=general")).data.expenses;
    assert.ok(generalFiltered.some((e) => e.id === general.id));
    assert.ok(generalFiltered.every((e) => e.employeeId === null));
    const legacyDelete = await request(`/api/expenses?year=2100&month=${freeMonth}`, { method: "DELETE", headers: { "x-delete-pin": pin } });
    assert.equal(legacyDelete.status, 200);
    assert.equal((await request(`/api/expenses?year=2100&employeeId=${beta.id}`)).data.expenses.some((e) => e.id === individual.id), true);
    console.log("PASS: general expenses remain separate; an old-style monthly delete cannot remove an employee's expense.");
  }
} finally {
  // IDs below are only from rows created by this test run. Never delete whole tables.
  for (const id of owned.reports) {
    const result = await request("/api/delete", json({ kind: "report", id, pin }));
    assert.ok(result.status === 200 || result.status === 404, JSON.stringify(result.data));
  }
  for (const id of owned.expenses) {
    const result = await request("/api/delete", json({ kind: "expense", id, pin }));
    assert.ok(result.status === 200 || result.status === 404, JSON.stringify(result.data));
  }
  for (const id of owned.employees) {
    const result = await request("/api/delete", json({ kind: "employee", id, pin }));
    assert.ok(result.status === 200 || result.status === 404, JSON.stringify(result.data));
  }
  if (baseline) {
    assert.deepEqual(await snapshot(), baseline);
    console.log("PASS: every test fixture removed; all pre-existing saved data is unchanged.");
  }
}
