export function translateProductCategory(category: string) {
  const labels: Record<string, string> = {
    CPU: "Процессор",
    GPU: "Видео карт",
    RAM: "Санах ой",
    MOTHERBOARD: "Эх хавтан",
    SSD: "SSD хадгалалт",
    POWER_SUPPLY: "Тэжээлийн блок",
    COOLER: "Хөргөлт",
    CASE: "Кейс",
    MONITOR: "Дэлгэц",
    PC_BUILD: "Бэлэн компьютер",
    MOUSE: "Хулгана",
    KEYBOARD: "Гар",
    MOUSEPAD: "Хулганы дэвсгэр",
  };

  return labels[category] ?? category.replaceAll("_", " ");
}
