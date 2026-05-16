import assert from "node:assert/strict";
import { canAccessPath } from "../src/lib/route-access";
import { type AppRole } from "../src/lib/roles";

const roles: AppRole[] = ["ADMIN", "CURATOR", "PARENT", "STUDENT"];

const cases: Array<{
  path: string;
  allowed: AppRole[];
}> = [
  { path: "/", allowed: roles },
  { path: "/students", allowed: roles },
  { path: "/students/student-id", allowed: roles },
  { path: "/events", allowed: roles },
  { path: "/feedback", allowed: roles },
  { path: "/approvals", allowed: ["ADMIN", "CURATOR"] },
  { path: "/diagnostics", allowed: ["ADMIN", "CURATOR"] },
  { path: "/students/new", allowed: ["ADMIN", "CURATOR"] },
  { path: "/students/student-id/diagnostics", allowed: ["ADMIN", "CURATOR"] },
  { path: "/events/new", allowed: ["ADMIN", "CURATOR"] },
  { path: "/events/sources", allowed: ["ADMIN", "CURATOR"] }
];

for (const item of cases) {
  for (const role of roles) {
    assert.equal(
      canAccessPath(role, item.path),
      item.allowed.includes(role),
      `${role} access to ${item.path}`
    );
  }
}

console.log("Route access checks passed.");
