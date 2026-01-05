import request from "supertest";
jest.mock("../../src/middlewares/auth", () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: "user-1",
      email: "owner@example.com",
      role: "ENTREPRENEUR",
    };
    next();
  },
  optionalAuth: (_req: any, _res: any, next: any) => next(),
  requireEntrepreneur: (_req: any, _res: any, next: any) => next(),
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

import app from "../../src/app";
import { prisma } from "../../src/config/database";
import axios from "axios";

jest.mock("../../src/config/database", () => ({
  prisma: {
    shop: {
      findUnique: jest.fn().mockResolvedValue({
        id: "shop-1",
        slug: "my-shop",
        owner: { id: "user-1", email: "owner@example.com" },
        subscription: null,
      }),
    },
    subscription: {
      create: jest.fn().mockResolvedValue({ id: "sub-1", amount: 100000 }),
    },
    subscriptionPayment: {
      create: jest.fn().mockResolvedValue({ id: "sp-1" }),
    },
  },
}));

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("POST /api/v1/subscriptions/initialize", () => {
  beforeAll(() => {
    mockedAxios.post.mockResolvedValue({
      data: {
        status: true,
        data: {
          authorization_url: "https://paystack/checkout",
          access_code: "AC123",
          reference: "REF123",
        },
      },
    });
  });

  it("initializes subscription and returns authorization data", async () => {
    // We need a valid auth token; assume middleware is mocked in integration or use a fake route that bypasses auth for tests.
    // For this test environment, you may need to mock auth middleware to attach req.user. Here we'll just call the controller directly via route assuming test env has middleware stub.

    const res = await request(app)
      .post("/api/v1/subscriptions/initialize")
      .set("Authorization", "Bearer test-token")
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("authorizationUrl");
    expect(res.body.data.authorizationUrl).toBe("https://paystack/checkout");

    // Ensure subscription record and payment record were created
    expect(prisma.subscription.create).toHaveBeenCalled();
    expect(prisma.subscriptionPayment.create).toHaveBeenCalled();
  });
});
