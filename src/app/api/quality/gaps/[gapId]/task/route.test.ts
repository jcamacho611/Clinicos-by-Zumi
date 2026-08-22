import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const enforcePermission = vi.fn();
const materialize = vi.fn();

class TestQualityTaskMaterializationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

vi.mock("@/lib/auth/session", () => ({ getClinicSession: () => getSession() }));
vi.mock("@/lib/auth/api-authorization", () => ({
  enforceApiPermission: (...args: unknown[]) => enforcePermission(...args),
}));
vi.mock("@/lib/repositories/quality-task-materialization-repository", () => ({
  materializeQualityGapTask: (...args: unknown[]) => materialize(...args),
  QualityTaskMaterializationError: TestQualityTaskMaterializationError,
}));

const { POST } = await import("@/app/api/quality/gaps/[gapId]/task/route");

const clinicSession = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-a",
  organizationName: "Clinic A",
  organizationSlug: "clinic-a",
  email: "quality@example.invalid",
  name: "Quality User",
  role: "quality",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

function request(body: unknown = {}) {
  return new Request("https://klinikos.io/api/quality/gaps/gap-1/task", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(clinicSession);
  enforcePermission.mockResolvedValue(null);
  materialize.mockResolvedValue({
    gapId: "gap-private",
    taskId: "task-1",
    taskStatus: "open",
    ownerId: null,
    created: true,
    idempotent: false,
    requiresReview: false,
  });
});

describe("quality gap task materialization API", () => {
  it("requires authentication", async () => {
    getSession.mockResolvedValue(null);
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(materialize).not.toHaveBeenCalled();
  });

  it("checks both quality update and task create authorization before materialization", async () => {
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(201);
    expect(enforcePermission).toHaveBeenNthCalledWith(1, clinicSession, "quality", "update", expect.objectContaining({ resourceId: "gap-1" }));
    expect(enforcePermission).toHaveBeenNthCalledWith(2, clinicSession, "tasks", "create", expect.objectContaining({ resourceId: "quality-gap:gap-1" }));
  });

  it("returns only the minimum task presentation fields", async () => {
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-private" }) });
    const payload = await response.json();
    expect(payload).toEqual({
      data: {
        taskId: "task-1",
        taskStatus: "open",
        ownerAssigned: false,
        created: true,
        idempotent: false,
        requiresReview: false,
      },
    });
    expect(JSON.stringify(payload)).not.toContain("gap-private");
    expect(JSON.stringify(payload)).not.toContain("org-a");
    expect(JSON.stringify(payload)).not.toContain("patient");
  });

  it("returns 200 for an idempotent existing materialization", async () => {
    materialize.mockResolvedValue({
      gapId: "gap-1",
      taskId: "task-existing",
      taskStatus: "open",
      ownerId: "owner-1",
      created: false,
      idempotent: true,
      requiresReview: false,
    });
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { taskId: "task-existing", ownerAssigned: true, idempotent: true } });
  });

  it("normalizes malformed input without exposing validator internals", async () => {
    const response = await POST(request({ ownerId: "" }), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({ error: "Invalid quality follow-up request." });
    expect(JSON.stringify(payload)).not.toMatch(/issues|path|zod/i);
  });

  it("preserves safe domain status without returning database internals", async () => {
    materialize.mockRejectedValue(new TestQualityTaskMaterializationError("A closed quality gap cannot create new follow-up work.", 409));
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "A closed quality gap cannot create new follow-up work." });
  });

  it("normalizes unexpected failures", async () => {
    materialize.mockRejectedValue(new Error("postgres://secret@private-host/schema internal stack"));
    const response = await POST(request(), { params: Promise.resolve({ gapId: "gap-1" }) });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Quality follow-up work could not be prepared." });
  });
});
