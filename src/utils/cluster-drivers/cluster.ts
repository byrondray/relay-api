type Coordinate = [number, number];

interface Driver {
  id: number;
  location: Coordinate;
  capacity: number; // Number of seats available
}

function calculateDistance(point1: Coordinate, point2: Coordinate): number {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function findClosestAvailableDriver(
  point: Coordinate,
  drivers: Driver[],
  driverLoads: Map<number, number>
): number | null {
  let closestDriver: Driver | null = null;
  let minDistance = Infinity;

  for (const driver of drivers) {
    const currentLoad = driverLoads.get(driver.id) || 0;
    if (currentLoad >= driver.capacity) continue; // Skip drivers who are full

    const distance = calculateDistance(point, driver.location);
    if (distance < minDistance) {
      minDistance = distance;
      closestDriver = driver;
    }
  }

  return closestDriver ? closestDriver.id : null;
}

function assignParentsToDrivers(
  locations: Coordinate[],
  drivers: Driver[]
): Map<number, number[]> {
  // Map to keep track of carpool assignments (driverId -> list of parent indices)
  const assignments: Map<number, number[]> = new Map();
  // Map to track the current load (number of assigned parents) for each driver
  const driverLoads: Map<number, number> = new Map();

  // Initialize maps
  for (const driver of drivers) {
    assignments.set(driver.id, []);
    driverLoads.set(driver.id, 0);
  }

  for (let i = 0; i < locations.length; i++) {
    const parentLocation = locations[i];
    const closestDriverId = findClosestAvailableDriver(
      parentLocation,
      drivers,
      driverLoads
    );

    if (closestDriverId !== null) {
      assignments.get(closestDriverId)?.push(i); // Assign parent to driver
      driverLoads.set(
        closestDriverId,
        (driverLoads.get(closestDriverId) || 0) + 1
      ); // Increment driver's load
    } else {
      console.log(
        `No available drivers for parent at index ${i} (Location: ${parentLocation})`
      );
    }
  }

  return assignments;
}

// Example usage with parent locations (lat, lon coordinates)
const locations: Coordinate[] = [
  [49.2827, -123.1207], // Vancouver, BC
  [49.2463, -123.1162], // Location 2
  [49.2531, -123.1398], // Location 3
  [49.2627, -123.1107], // Location 4
  [49.2327, -123.0907], // Location 5
  // Add more parent locations here
];

// Define drivers with their starting locations and seat capacities
const drivers: Driver[] = [
  { id: 1, location: [49.2827, -123.1207], capacity: 2 }, // Driver 1 with 2 seats
  { id: 2, location: [49.2463, -123.1162], capacity: 3 }, // Driver 2 with 3 seats
  { id: 3, location: [49.2531, -123.1398], capacity: 1 }, // Driver 3 with 1 seat
];

// Assign parents to drivers while respecting seating capacity
const carpoolAssignments = assignParentsToDrivers(locations, drivers);

console.log(
  'Carpool assignments (driverId -> parent indices):',
  carpoolAssignments
);
