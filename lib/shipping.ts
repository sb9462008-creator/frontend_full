export const addressLabels = ["Гэр", "Ажил", "Эцэг эхийнх", "Хүүхдийнх", "Оюутны байр"] as const;
export const cityOptions = ["Улаанбаатар", "Дархан", "Эрдэнэт", "Сэлэнгэ", "Хөвсгөл"] as const;

export async function geocodeShippingAddress(query: string) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (token) {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query,
      )}.json?access_token=${token}&country=mn&limit=1`,
    );

    if (!response.ok) {
      throw new Error("Хүргэлтийн хаягийг газрын зураг дээр тодорхойлж чадсангүй.");
    }

    const data = await response.json();
    const match = data.features?.[0];

    if (!match?.center || match.center.length < 2) {
      throw new Error("Хүргэлтийн хаяг олдсонгүй. Илүү дэлгэрэнгүй бичээд дахин оролдоно уу.");
    }

    return {
      latitude: match.center[1] as number,
      longitude: match.center[0] as number,
    };
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=mn&q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error("Хүргэлтийн хаягийг газрын зураг дээр тодорхойлж чадсангүй.");
  }

  const data = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;
  const match = data[0];

  if (!match?.lat || !match.lon) {
    throw new Error("Хүргэлтийн хаяг олдсонгүй. Илүү дэлгэрэнгүй бичээд дахин оролдоно уу.");
  }

  return {
    latitude: Number(match.lat),
    longitude: Number(match.lon),
  };
}
