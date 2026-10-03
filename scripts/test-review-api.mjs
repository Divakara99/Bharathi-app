import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const pin = process.env.TEST_DELETE_PIN ?? "9676";
const prefix = `QA Review ${randomUUID().slice(0, 8)}`;
const employeeName = prefix + " Employee";
const parallelName = prefix + " Parallel";
const orphanName = prefix + " MissingReport";
const owned = { reports: [], expenses: [], employees: [] };
async function request(path, body, method = body === undefined ? "GET" : "POST") {
  const response = await fetch(base + path, {
    method,
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, data: await response.json() };
}
async function snapshot() {
  const [e, r, c] = await Promise.all([request("/api/employees"), request("/api/reports"), request("/api/expenses")]);
  for (const result of [e, r, c]) assert.equal(result.status, 200, JSON.stringify(result.data));
  const sort = (rows) => [...rows].sort((a, b) => a.id - b.id);
  return { employees: sort(e.data.employees), reports: sort(r.data.reports), expenses: sort(c.data.expenses) };
}
async function deleteOne(kind, id) {
  const result = await request("/api/delete", { kind, id, pin });
  assert.ok(result.status === 200 || result.status === 404, JSON.stringify(result.data));
}
const baseline = await snapshot();
try {
  for (const path of ["/api/reports?year=bad", "/api/reports?year=2.5", "/api/reports?year=", "/api/expenses?employeeId=2147483648"]) {
    assert.equal((await request(path)).status, 400, path);
  }
  for (const path of ["/api/reports", "/api/expenses", "/api/employees", "/api/delete"]) {
    const badJson = await fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{invalid", signal: AbortSignal.timeout(20000) });
    assert.equal(badJson.status, 400, path);
    assert.equal((await request(path, [])).status, 400, path);
  }
  console.log("PASS API: malformed JSON, non-record bodies and invalid query parameters give clear 400 errors.");

  const employee = await request("/api/employees", { name: employeeName });
  assert.equal(employee.status, 201); owned.employees.push(employee.data.employee.id);
  const valid = { empName: employeeName, year: 2099, month: 1, cycle: 1, deliveries: 3, pricePerDelivery: 0.29, notes: prefix };
  const invalidCases = [
    { deliveries: null }, { deliveries: true }, { deliveries: [] }, { deliveries: "" }, { deliveries: 1.5 }, { deliveries: 2147483648 },
    { pricePerDelivery: false }, { pricePerDelivery: [] }, { pricePerDelivery: -1 }, { pricePerDelivery: 0.335 }, { pricePerDelivery: 100000000 },
    { deliveries: 2147483647, pricePerDelivery: 100 }, { year: false }, { month: [] }, { cycle: true }, { notes: { text: "bad" } },
  ];
  for (const invalid of invalidCases) assert.equal((await request("/api/reports", { ...valid, ...invalid })).status, 400, JSON.stringify(invalid));
  for (const id of ["0", "1.5", "2147483648", "bad"]) assert.equal((await request(`/api/reports/${id}`, valid, "PATCH")).status, 400);
  for (const value of [true, [], null, "", -1, 1.333, 10000000000]) {
    assert.equal((await request("/api/expenses", { employeeId: employee.data.employee.id, year: 2099, month: 1, amount: value })).status, 400);
  }
  console.log("PASS API: invalid number types, precision, database bounds and IDs are rejected without saving anything.");

  const creates = await Promise.all(Array.from({ length: 10 }, (_, index) => request("/api/reports", { ...valid, empName: index % 2 ? employeeName.toLowerCase() : employeeName })));
  for (const result of creates) if (result.status === 201) owned.reports.push(result.data.report.id);
  assert.equal(creates.filter((result) => result.status === 201).length, 1);
  assert.equal(creates.filter((result) => result.status === 409).length, 9);
  assert.equal(creates.find((result) => result.status === 201).data.report.totalValue, "0.87");
  const parallel = await Promise.all(Array.from({ length: 6 }, (_, index) => request("/api/employees", { name: index % 2 ? parallelName.toLowerCase() : parallelName })));
  for (const result of parallel) if (result.status === 201) owned.employees.push(result.data.employee.id);
  assert.equal(parallel.filter((result) => result.status === 201).length, 1);
  assert.equal(parallel.filter((result) => result.status === 409).length, 5);
  console.log("PASS API: 10 simultaneous report saves create only one entry; case-insensitive concurrent employee creation is safe.");

  const id = owned.reports[0];
  const edited = await request(`/api/reports/${id}`, { ...valid, deliveries: 7 }, "PATCH");
  assert.equal(edited.status, 200);
  assert.equal(edited.data.report.totalValue, "2.03");
  assert.equal(edited.data.report.pricePerDelivery, "0.29");
  let unusedReportId = 2147483647;
  while (baseline.reports.some((row) => row.id === unusedReportId) || owned.reports.includes(unusedReportId)) unusedReportId--;
  const missing = await request(`/api/reports/${unusedReportId}`, { ...valid, empName: orphanName }, "PATCH");
  assert.equal(missing.status, 404);
  assert.equal((await request("/api/employees")).data.employees.some((row) => row.name === orphanName), false);
  const blocked = await request("/api/delete", { kind: "employee", id: employee.data.employee.id, pin });
  assert.equal(blocked.status, 409);
  const wrong = await request("/api/delete", { kind: "report", id, pin: "1234" });
  assert.equal(wrong.status, 403);
  assert.equal((await request(`/api/reports?year=2099&emp=${encodeURIComponent(employeeName)}`)).data.reports.length, 1);
  console.log("PASS API: editing uses exact stored prices; missing-report edits do not create employees; PIN and saved-data deletion protections remain active.");
} finally {
  for (const id of owned.reports) await deleteOne("report", id);
  for (const id of owned.expenses) await deleteOne("expense", id);
  for (const id of owned.employees) await deleteOne("employee", id);
  assert.deepEqual(await snapshot(), baseline);
  console.log("PASS: only this run's test IDs were removed; every original saved record is unchanged.");
}
