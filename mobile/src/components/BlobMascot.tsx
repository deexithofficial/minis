import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';

export type MascotName =
  | 'green-thinking'
  | 'yellow-happy'
  | 'blue-pointing'
  | 'coral-celebrating'
  | 'pink-shy'
  | 'lightblue-sad'
  | 'lavender-sad-spare'
  | 'mint-worried-spare';

export const MASCOTS: Record<MascotName, ImageSourcePropType> = {
  'green-thinking': require('../assets/mascots/green-thinking.png'),
  'yellow-happy': require('../assets/mascots/yellow-happy.png'),
  'blue-pointing': require('../assets/mascots/blue-pointing.png'),
  'coral-celebrating': require('../assets/mascots/coral-celebrating.png'),
  'pink-shy': require('../assets/mascots/pink-shy.png'),
  'lightblue-sad': require('../assets/mascots/lightblue-sad.png'),
  'lavender-sad-spare': require('../assets/mascots/lavender-sad-spare.png'),
  'mint-worried-spare': require('../assets/mascots/mint-worried-spare.png'),
};

export interface BlobMascotProps {
  name: MascotName;
  size?: number;
}

export function BlobMascot({ name, size = 160 }: BlobMascotProps) {
  return (
    <Image
      testID="blob-mascot"
      source={MASCOTS[name]}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
