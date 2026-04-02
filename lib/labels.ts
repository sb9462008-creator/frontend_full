const labelMap: Record<string, string> = {
  PENDING: "Хүлээгдэж байна",
  ASSIGNED: "Оноосон",
  ACCEPTED: "Хүлээн авсан",
  PICKED_UP: "Авсан",
  IN_TRANSIT: "Замд явж байна",
  NEAR_DESTINATION: "Очих хаягт ойртсон",
  DELIVERED: "Хүргэгдсэн",
  FAILED: "Амжилтгүй",
  RETURNED: "Буцаасан",
  CANCELLED: "Цуцлагдсан",
  AVAILABLE: "Бэлэн",
  BUSY: "Ажилтай",
  OFFLINE: "Офлайн",
  PLACED: "Илгээсэн",
  PROCESSING: "Боловсруулж байна",
  SHIPPED: "Хүргэлтэд гарсан",
  SUPER_ADMIN: "Супер админ",
  COMPANY_ADMIN: "Компанийн админ",
  DISPATCHER: "Зохицуулагч",
  DRIVER: "Курьер",
  CUSTOMER: "Хэрэглэгч",
  CREATED: "Үүсгэсэн",
  STATUS_UPDATED: "Төлөв шинэчилсэн",
  ASSIGNED_DRIVER: "Курьер оноосон",
  ASSIGNED_AT_CREATION: "Үүсгэх үед оноосон",
  PROOF_UPLOADED: "Хүргэлтийн баталгаа оруулсан",
};

const eventLabelMap: Record<string, string> = {
  CREATED: "Үүсгэсэн",
  ASSIGNED: "Оноосон",
  STATUS_UPDATED: "Төлөв шинэчилсэн",
  PROOF_UPLOADED: "Хүргэлтийн баталгаа оруулсан",
};

export function translateLabel(value?: string | null) {
  if (!value) {
    return "Мэдээлэл алга";
  }

  return labelMap[value] ?? value.replaceAll("_", " ");
}

export function translateEventType(value?: string | null) {
  if (!value) {
    return "Үйл явдал алга";
  }

  return eventLabelMap[value] ?? translateLabel(value);
}
