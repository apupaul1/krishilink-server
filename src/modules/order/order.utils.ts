import crypto from "crypto";
import { TOrderStatus } from "./order.interface";


interface ILocation {
  district: string;
  area: string;
}

export const calculateDeliveryCharge = (
  farmerLocation: ILocation,
  customerLocation: ILocation,
  baseCharge: number,
) => {
  // Same area / upazila
  if (
    farmerLocation.district === customerLocation.district &&
    farmerLocation.area === customerLocation.area
  ) {
    return baseCharge;
  }

  // Same district, different area
  if (farmerLocation.district === customerLocation.district) {
    return 70;
  }

  // Different district
  return 100;
};


export const allowedStatusTransitions: Record<TOrderStatus, TOrderStatus[]> = {
  pending: ["preparing", "cancelled"],

  preparing: ["ready_for_pickup", "cancelled"],

  ready_for_pickup: ["waiting_for_rider_acceptance"],

  waiting_for_rider_acceptance: ["rider_assigned"],

  rider_assigned: ["picked_up"],

  picked_up: ["out_for_delivery"],

  out_for_delivery: ["delivered", "cancelled"],

  delivered: [],

  cancelled: [],
};

export function generateTrackingId() {
  const prefix = "KL";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `${prefix}-${date}-${random}`;
}