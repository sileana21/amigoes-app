import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

type Props = {
  onStep: () => void;
};

export default function StepTracker({ onStep }: Props) {
  const lastPeak = useRef(0);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100); // 10hz

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      // magnitude of movement
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      if (magnitude > 1.35) {
        const now = Date.now();

        // Cooldown of 350ms to avoid double-counting
        if (now - lastPeak.current > 350) {
          onStep();
          lastPeak.current = now;
        }
      }
    });

    return () => subscription && subscription.remove();
  }, [onStep]);

  return null; // component doesn't render anything
}
