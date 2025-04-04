import type { RentOrder, Status } from "../types"

const equipment = [
  { id: "cam1", name: "ARRI Alexa Mini", daily_rate: 650, quantity: 1 },
  { id: "lens2", name: "Zeiss Supreme Prime Set", daily_rate: 450, quantity: 1 },
  { id: "audio3", name: "Wireless Lavalier Kit", daily_rate: 85, quantity: 2 },
  { id: "light1", name: "ARRI SkyPanel S60-C", daily_rate: 180, quantity: 2 },
  { id: "prod1", name: "Director's Monitor Package", daily_rate: 220, quantity: 1 },
  { id: "prod2", name: "Teradek Wireless Video System", daily_rate: 180, quantity: 1 }
];

const statuses: Status[] = ["pending", "approved", "completed", "rejected"];

const firstNames = ["John", "Maria", "David", "Emma", "Michael", "Sarah", "James", "Lisa",
  "Robert", "Jennifer", "William", "Patricia", "Richard", "Elizabeth", "Joseph", "Margaret",
  "Thomas", "Sandra", "Charles", "Karen"];

const lastNames = ["Smith", "Garcia", "Johnson", "Wilson", "Brown", "Davis", "Miller", "Anderson",
  "Taylor", "Martinez", "Thompson", "Moore", "White", "Lee", "Harris", "Clark",
  "Rodriguez", "Lewis", "Walker", "Hall"];

function generateRentOrders(count: number): RentOrder[] {
  const orders: RentOrder[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Last week

  for (let i = 0; i < count; i++) {
    const rentalStartDate = new Date(startDate);
    rentalStartDate.setHours(rentalStartDate.getHours() + (i * 3)); // Spread orders over the two weeks
    const rentalEndDate = new Date(rentalStartDate);
    rentalEndDate.setDate(rentalEndDate.getDate() + Math.floor(Math.random() * 5) + 2); // 2-7 days rental

    // Generate 2-4 random equipment items
    const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items
    const selectedEquipment = [];
    const usedIds = new Set();

    while (selectedEquipment.length < numItems) {
      const randomIndex = Math.floor(Math.random() * equipment.length);
      const item = equipment[randomIndex];
      if (!usedIds.has(item.id)) {
        usedIds.add(item.id);
        selectedEquipment.push({
          ...item,
          quantity: Math.floor(Math.random() * 2) + 1 // 1-2 quantity
        });
      }
    }

    const status: Status = statuses[Math.floor(Math.random() * statuses.length)];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const phone = `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const referenceNumber = `RNT-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    const rentalDays = (rentalEndDate.getTime() - rentalStartDate.getTime()) / (1000 * 60 * 60 * 24);
    const estimatedCost = selectedEquipment.reduce((total, item) => {
      return total + (item.daily_rate * item.quantity * rentalDays);
    }, 0);

    const order: RentOrder = {
      id: String(i + 6), // Starting from 6 since we already have 1-5
      reference: referenceNumber,
      customer: fullName,
      date: rentalStartDate.toISOString().split('T')[0],
      amount: estimatedCost,
      status,
      originalData: {
        id: String(i + 6),
        full_name: fullName,
        email,
        phone,
        equipment_items: selectedEquipment,
        rental_start: rentalStartDate.toISOString().split('T')[0],
        rental_end: rentalEndDate.toISOString().split('T')[0],
        special_requirements: "",
        estimated_cost: estimatedCost,
        status,
        reference_number: referenceNumber,
      },
    };

    orders.push(order);
  }

  return orders;
}

// Generate 50 sample orders
export const SAMPLE_RENT_ORDERS: RentOrder[] = generateRentOrders(50);
