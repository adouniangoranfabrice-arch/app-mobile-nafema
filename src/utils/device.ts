import * as Device from "expo-device";
import { Platform } from "react-native";

const DEVICE_TYPES: Record<Device.DeviceType, string> = {
  [Device.DeviceType.UNKNOWN]: "inconnu",
  [Device.DeviceType.PHONE]: "téléphone",
  [Device.DeviceType.TABLET]: "tablette",
  [Device.DeviceType.DESKTOP]: "ordinateur",
  [Device.DeviceType.TV]: "télévision",
};

/** Informations sur l'appareil utilisé (null si le système ne les fournit pas) */
export function getDeviceInfo() {
  return {
    platform: Platform.OS,
    type: DEVICE_TYPES[Device.deviceType ?? Device.DeviceType.UNKNOWN],
    brand: Device.brand,
    manufacturer: Device.manufacturer,
    model: Device.modelName,
    name: Device.deviceName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    isPhysicalDevice: Device.isDevice, // false sur un émulateur ou un simulateur
  };
}

export type DeviceInfo = ReturnType<typeof getDeviceInfo>;

/** Libellé court de l'appareil, ex. « samsung SM-A546E (android 14) » */
export function deviceLabel(device: DeviceInfo) {
  const model = [device.brand, device.model].filter(Boolean).join(" ");
  const system = [device.platform, device.osVersion].filter(Boolean).join(" ");
  return model ? `${model} (${system})` : system;
}
