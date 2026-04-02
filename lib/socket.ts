const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function createRealtimeSocket(input?: {
  accessToken?: string;
  trackingCode?: string;
  tenantId?: string;
  deliveryId?: string;
  driverId?: string;
}) {
  const { io } = await import("socket.io-client");

  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: input?.accessToken ? { token: input.accessToken } : undefined,
  });

  socket.on("connect", () => {
    if (input?.trackingCode) {
      socket.emit("tracking:subscribe", input.trackingCode);
    }

    if (input?.tenantId) {
      socket.emit("tenant:subscribe", input.tenantId);
    }

    if (input?.deliveryId) {
      socket.emit("delivery:subscribe", input.deliveryId);
    }

    if (input?.driverId) {
      socket.emit("driver:subscribe", input.driverId);
    }
  });

  return socket;
}
