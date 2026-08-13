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


import { TOrderStatus } from "./order.interface";

export const allowedStatusTransitions: Record<
  TOrderStatus,
  TOrderStatus[]
> = {
  pending: ["preparing", "cancelled"],

  preparing: ["ready_for_pickup", "cancelled"],

  ready_for_pickup: ["assigned"],

  assigned: ["picked_up"],

  picked_up: ["out_for_delivery"],

  out_for_delivery: ["delivered"],

  delivered: [],

  cancelled: [],
};