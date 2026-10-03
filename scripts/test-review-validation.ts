import assert from "node:assert/strict";
import { parseReportInput } from "../src/lib/report-input";
import { deliveryTotal, inputInteger, inputMoney, MAX_DB_INTEGER } from "../src/lib/input-validation";
import { csvCell } from "../src/lib/csv";

const good = { empName: "  Ramesh  Kumar ", year: 2026, month: 2, cycle: 2, deliveries: 3, pricePerDelivery: 0.29, notes: "Fuel" };
const parsed = parseReportInput(good);
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("Valid delivery input was rejected.");
assert.equal(parsed.data.empName, "Ramesh Kumar");
assert.equal(parsed.data.totalValue, "0.87");
for (const value of [null, [], false, "record", { ...good, empName: 123 }, { ...good, deliveries: null }, { ...good, deliveries: true },
  { ...good, deliveries: [] }, { ...good, deliveries: "" }, { ...good, deliveries: 2.5 }, { ...good, deliveries: MAX_DB_INTEGER + 1 },
  { ...good, pricePerDelivery: -1 }, { ...good, pricePerDelivery: Infinity }, { ...good, pricePerDelivery: "not a price" },
  { ...good, pricePerDelivery: 0.333 }, { ...good, pricePerDelivery: 100000000 }, { ...good, deliveries: MAX_DB_INTEGER, pricePerDelivery: 100 },
  { ...good, year: [] }, { ...good, month: null }, { ...good, cycle: true }, { ...good, notes: { fuel: 50 } },
]) assert.equal(parseReportInput(value).ok, false, JSON.stringify(value));
assert.equal(deliveryTotal(150, 22.5), "3375.00");
assert.equal(inputMoney("0.29", "Amount"), 0.29);
assert.equal(inputMoney(9999999999.99, "Amount"), 9999999999.99);
for (const value of [[], {}, true, null, "", " ", NaN, Infinity, -1, 1.333]) assert.throws(() => inputMoney(value, "Amount"));
for (const value of [[], null, true, "", 0, -1, 1.5, MAX_DB_INTEGER + 1]) assert.throws(() => inputInteger(value, "ID", 1, MAX_DB_INTEGER));
assert.equal(csvCell('=HYPERLINK("https://example.com")'), '"\'=HYPERLINK(""https://example.com"")"');
assert.equal(csvCell(-120.5, true), '"-120.50"');
assert.equal(csvCell('பாரதி, "ரவி"'), '"பாரதி, ""ரவி"""');
console.log("PASS: bounded two-decimal money, whole deliveries, exact paise totals, malformed/type-invalid input rejection and safe CSV names.");
